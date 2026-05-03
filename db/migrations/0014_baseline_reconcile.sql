-- 0014_baseline_reconcile.sql
--
-- Reconciles the migration history with what's actually running in prod.
-- The reconstructed 0001_baseline.sql declared an idealized schema; this
-- migration captures the drift accumulated since (some intentional, some
-- by hand in the Supabase SQL editor) so a fresh install ends up with the
-- same schema as prod.
--
-- IDEMPOTENT: every statement uses `if exists` / `if not exists` /
-- `create or replace` so re-running on prod is safe (no-op for things
-- already in place).
--
-- Critical fixes:
--   * Drop the loose accounts RLS policies that defeat the
--     status='AVAILABLE' lockdown from 0007. Sellers could edit/delete
--     SOLD listings; SOLD listings were publicly readable.
--   * Replace the "accounts are public" all-rows policy with one that
--     gates on status = AVAILABLE OR ownership.
--
-- Domain:
--   * Re-enforce accounts.price <= 100000 cents (€1000 cap) at DB level
--     so a misbehaving server action can't slip past PRICE_CAP_CENTS.
--   * Drop accounts.level and accounts.rank (0002 intent; never applied).
--
-- Drift to lock in (prod has, prior migrations didn't declare):
--   * account_status ENUM type (replaces baseline text + CHECK).
--   * accounts.updated_at + on_accounts_update trigger via set_updated_at.
--   * profiles.updated_at + on_profiles_changed trigger via ensure_store_id
--     (which also assigns store_id from sequence on first is_seller flip).
--   * games.created_at.
--   * idx_credentials_seller.
--   * Sequence renamed: profiles_store_id_seq → store_id_seq.
--   * handle_new_user() (richer body, raw_user_meta_data) replaces
--     baseline's handle_new_auth_user(). Auth-trigger rewired.
--
-- Not addressed here (called out for follow-up if you want):
--   * offer_reviews.offer_id is NULLABLE with FK ON DELETE SET NULL in
--     prod. Baseline declared NOT NULL + CASCADE. Listing deletion would
--     orphan reviews. Currently safe because deletes are gated, but data-
--     integrity smell — flip to NOT NULL + CASCADE in a future migration
--     once you confirm no rows have null offer_id.
--   * offer_reviews.reviewer_id and seller_id FK to profiles(id) instead
--     of auth.users(id). Functionally equivalent; not worth churn.

begin;

-- =========================================================================
-- 1. CRITICAL: tighten accounts RLS policies
-- =========================================================================

-- The looser, status-agnostic policies defeat the SOLD lockdown from 0007.
-- Drop them; the strict accounts_update_own / accounts_delete_own from
-- 0007 stay in place.
drop policy if exists "accounts are public" on public.accounts;
drop policy if exists "seller updates own account" on public.accounts;
drop policy if exists "seller deletes own account" on public.accounts;

-- Replace "accounts are public" with a properly-gated SELECT policy.
-- Anyone reads AVAILABLE listings. Sellers read all their own listings
-- (any status). accounts_select_buyer (added in 0010) lets the buyer of
-- a SOLD listing still read it via the orders join.
drop policy if exists accounts_select_public on public.accounts;
create policy accounts_select_public on public.accounts
  for select using (
    status = 'AVAILABLE'::public.account_status
    or seller_id = auth.uid()
  );

-- =========================================================================
-- 2. Domain constraints
-- =========================================================================

-- €1000 cap (was in baseline, dropped during prod drift). Re-enforce at DB
-- level. Will fail if any existing row has price > 100000 — verify first
-- with: select count(*) from public.accounts where price > 100000;
alter table public.accounts
  drop constraint if exists accounts_price_check;
alter table public.accounts
  add constraint accounts_price_check check (
    price >= 0 and price <= 100000
  );

-- Drop dead columns (0002 intent; never landed in prod).
alter table public.accounts drop column if exists level;
alter table public.accounts drop column if exists rank;

-- =========================================================================
-- 3. offer_reviews: drop the duplicate UPDATE policy
-- =========================================================================

-- offer_reviews_update_own (from 0013) and "reviewer updates own review"
-- (legacy) are equivalent. Keep the modern one.
drop policy if exists "reviewer updates own review" on public.offer_reviews;

-- =========================================================================
-- 4. Lock in undeclared prod drift (so fresh installs match prod)
-- =========================================================================

-- account_status ENUM (vs. text + CHECK)
do $$
begin
  if not exists (
    select 1 from pg_type t
    join pg_namespace n on n.oid = t.typnamespace
    where t.typname = 'account_status' and n.nspname = 'public'
  ) then
    create type public.account_status as enum ('AVAILABLE','RESERVED','SOLD');
  end if;
end $$;

-- updated_at / created_at columns
alter table public.accounts add column if not exists updated_at timestamptz not null default now();
alter table public.profiles add column if not exists updated_at timestamptz not null default now();
alter table public.games    add column if not exists created_at timestamptz not null default now();

-- set_updated_at: simple bump-on-update trigger function. Distinct from
-- baseline's touch_updated_at — both exist in prod; both do the same
-- thing; consolidating them is more risk than it's worth.
create or replace function public.set_updated_at()
returns trigger language plpgsql as $$
begin
  new.updated_at := now();
  return new;
end; $$;

drop trigger if exists on_accounts_update on public.accounts;
create trigger on_accounts_update
  before update on public.accounts
  for each row execute function public.set_updated_at();

-- ensure_store_id: assign store_id from sequence on first is_seller=true,
-- and bump updated_at. Replaces baseline's nextval default on the column.
create sequence if not exists public.store_id_seq
  start with 100 increment by 1;

create or replace function public.ensure_store_id()
returns trigger language plpgsql as $$
begin
  if new.is_seller = true and new.store_id is null then
    new.store_id := nextval('public.store_id_seq');
  end if;
  new.updated_at := now();
  return new;
end; $$;

drop trigger if exists on_profiles_changed on public.profiles;
create trigger on_profiles_changed
  before insert or update on public.profiles
  for each row execute function public.ensure_store_id();

-- handle_new_user: signup trigger that pulls name/avatar from
-- raw_user_meta_data. Replaces baseline's handle_new_auth_user.
create or replace function public.handle_new_user()
returns trigger
language plpgsql
security definer
set search_path = public
as $$
begin
  insert into public.profiles (id, email, name, avatar_url, is_seller)
  values (
    new.id,
    new.email,
    coalesce(
      new.raw_user_meta_data->>'full_name',
      new.raw_user_meta_data->>'name',
      split_part(coalesce(new.email, ''), '@', 1)
    ),
    coalesce(
      new.raw_user_meta_data->>'boost_avatar_url',
      new.raw_user_meta_data->>'avatar_url'
    ),
    coalesce((new.raw_user_meta_data->>'isSeller')::boolean, false)
  )
  on conflict (id) do nothing;
  return new;
end; $$;

-- Re-wire the auth.users trigger from handle_new_auth_user → handle_new_user.
-- Requires postgres-role privileges on auth schema; the Supabase SQL editor
-- has them.
drop trigger if exists on_auth_user_created on auth.users;
create trigger on_auth_user_created
  after insert on auth.users
  for each row execute function public.handle_new_user();

drop function if exists public.handle_new_auth_user();

-- credentials seller index — undeclared but useful for "my listings'
-- credentials" lookups.
create index if not exists idx_credentials_seller
  on public.credentials (seller_id);

commit;
