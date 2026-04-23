-- 0001_baseline.sql
--
-- RECONSTRUCTED BASELINE — not introspected from the live DB.
-- The shape below is inferred from the application code (src/lib/offers.ts,
-- src/lib/credentials.ts, src/app/(dashboard)/**/actions.ts) and from
-- BoostV2_DB_Architecture.md. Before running this against an empty Postgres
-- or treating it as authoritative, run the introspection queries in
-- db/migrations/README.md against production and reconcile any drift in a
-- follow-up 0002_*.sql.
--
-- Places to double-check against live:
--   * account & review id column types (uuid vs text/cuid)
--   * exact RLS policy bodies — intent is captured, but Supabase may have
--     slightly different policy names / conditions
--   * the create_listings_bulk function body
--   * the store_id trigger (timing + condition)
--
-- Everything in this file is wrapped in idempotent guards so re-running is
-- safe against a database that already has the objects.

begin;

-- --------------------------------------------------------------------------
-- Extensions
-- --------------------------------------------------------------------------

create extension if not exists "pgcrypto"; -- gen_random_uuid()

-- --------------------------------------------------------------------------
-- profiles
-- --------------------------------------------------------------------------
-- One row per auth.users entry. Auto-created by a trigger on signup.
-- `store_id` auto-increments from 100 for sellers.

create sequence if not exists public.profiles_store_id_seq
  start with 100
  increment by 1;

create table if not exists public.profiles (
  id uuid primary key references auth.users(id) on delete cascade,
  email text not null,
  name text,
  avatar_url text,
  is_seller boolean not null default false,
  store_id integer unique default nextval('public.profiles_store_id_seq'),
  created_at timestamptz not null default now()
);

alter sequence public.profiles_store_id_seq owned by public.profiles.store_id;

-- Auto-create a profile row when a user signs up via Supabase Auth.
create or replace function public.handle_new_auth_user()
returns trigger
language plpgsql
security definer
set search_path = public
as $$
begin
  insert into public.profiles (id, email)
  values (new.id, coalesce(new.email, new.id::text || '@no-email.local'))
  on conflict (id) do nothing;
  return new;
end;
$$;

drop trigger if exists on_auth_user_created on auth.users;
create trigger on_auth_user_created
  after insert on auth.users
  for each row execute function public.handle_new_auth_user();

-- --------------------------------------------------------------------------
-- games
-- --------------------------------------------------------------------------

create table if not exists public.games (
  id uuid primary key default gen_random_uuid(),
  slug text not null unique,
  name text not null,
  subtitle text,
  cover text
);

-- --------------------------------------------------------------------------
-- accounts  (= listings)
-- --------------------------------------------------------------------------

create table if not exists public.accounts (
  id uuid primary key default gen_random_uuid(),
  game_id uuid not null references public.games(id) on delete restrict,
  seller_id uuid not null references auth.users(id) on delete restrict,
  title text not null,
  description text,
  region text,
  level text,
  rank text,
  price integer not null check (price >= 0 and price <= 100000),
  old_price integer check (old_price is null or old_price >= 0),
  images text[] not null default '{}',
  status text not null default 'AVAILABLE'
    check (status in ('AVAILABLE', 'RESERVED', 'SOLD')),
  offer_ends_at timestamptz,
  created_at timestamptz not null default now(),
  constraint old_price_gte_price
    check (old_price is null or old_price >= price)
);

create index if not exists accounts_game_status_idx
  on public.accounts (game_id, status);
create index if not exists accounts_seller_idx
  on public.accounts (seller_id);
create index if not exists accounts_status_created_idx
  on public.accounts (status, created_at desc);

-- --------------------------------------------------------------------------
-- credentials
-- --------------------------------------------------------------------------
-- One row per listing. Holds the AES-256-GCM ciphertext of the seller's
-- account credentials (login, password, email, etc). Plaintext never reaches
-- the DB — encryption happens in src/lib/encryption.ts before insert.

create table if not exists public.credentials (
  id uuid primary key default gen_random_uuid(),
  account_id uuid not null unique references public.accounts(id) on delete cascade,
  seller_id uuid not null references auth.users(id) on delete cascade,
  encrypted_data text not null,
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now()
);

create or replace function public.touch_updated_at()
returns trigger language plpgsql as $$
begin
  new.updated_at = now();
  return new;
end;
$$;

drop trigger if exists credentials_touch_updated_at on public.credentials;
create trigger credentials_touch_updated_at
  before update on public.credentials
  for each row execute function public.touch_updated_at();

-- --------------------------------------------------------------------------
-- offer_reviews
-- --------------------------------------------------------------------------

create table if not exists public.offer_reviews (
  id uuid primary key default gen_random_uuid(),
  offer_id uuid not null references public.accounts(id) on delete cascade,
  reviewer_id uuid not null references auth.users(id) on delete cascade,
  rating integer not null check (rating between 1 and 5),
  body text,
  created_at timestamptz not null default now()
);

create index if not exists offer_reviews_offer_idx
  on public.offer_reviews (offer_id, created_at desc);

-- --------------------------------------------------------------------------
-- create_listings_bulk(p_game_id uuid, p_listings jsonb)
-- --------------------------------------------------------------------------
-- Atomic bulk insert used by the CSV upload flow. Inserts one row into
-- `accounts` per element of `p_listings`, and also into `credentials` when
-- `encrypted_credentials` is present. All rows persist or none do.
-- Uses the caller's auth.uid() as seller_id.

create or replace function public.create_listings_bulk(
  p_game_id uuid,
  p_listings jsonb
)
returns uuid[]
language plpgsql
security invoker
as $$
declare
  v_caller uuid := auth.uid();
  v_ids uuid[] := array[]::uuid[];
  v_item jsonb;
  v_account_id uuid;
begin
  if v_caller is null then
    raise exception 'Not authenticated';
  end if;

  for v_item in select * from jsonb_array_elements(p_listings)
  loop
    insert into public.accounts (
      game_id, seller_id, title, description,
      region, level, rank,
      price, old_price, images, status
    ) values (
      p_game_id,
      v_caller,
      v_item->>'title',
      nullif(v_item->>'description', ''),
      nullif(v_item->>'region', ''),
      nullif(v_item->>'level', ''),
      nullif(v_item->>'rank', ''),
      (v_item->>'price')::int,
      nullif(v_item->>'old_price', '')::int,
      coalesce(
        array(select jsonb_array_elements_text(v_item->'images')),
        '{}'::text[]
      ),
      'AVAILABLE'
    )
    returning id into v_account_id;

    if (v_item->>'encrypted_credentials') is not null
       and length(v_item->>'encrypted_credentials') > 0 then
      insert into public.credentials (account_id, seller_id, encrypted_data)
      values (v_account_id, v_caller, v_item->>'encrypted_credentials');
    end if;

    v_ids := array_append(v_ids, v_account_id);
  end loop;

  return v_ids;
end;
$$;

-- --------------------------------------------------------------------------
-- Row-Level Security
-- --------------------------------------------------------------------------

alter table public.profiles        enable row level security;
alter table public.games           enable row level security;
alter table public.accounts        enable row level security;
alter table public.credentials     enable row level security;
alter table public.offer_reviews   enable row level security;

-- profiles: world-readable, self-writable.
drop policy if exists profiles_select on public.profiles;
create policy profiles_select on public.profiles
  for select using (true);

drop policy if exists profiles_insert_self on public.profiles;
create policy profiles_insert_self on public.profiles
  for insert with check (id = auth.uid());

drop policy if exists profiles_update_self on public.profiles;
create policy profiles_update_self on public.profiles
  for update using (id = auth.uid())
  with check (id = auth.uid());

-- games: world-readable, admin-only writes (no policy = no writes via
-- anon/auth roles; the service-role key bypasses RLS).
drop policy if exists games_select on public.games;
create policy games_select on public.games
  for select using (true);

-- accounts: public listings visible to everyone; seller sees all their own.
-- Seller can insert/update/delete their own rows.
drop policy if exists accounts_select_public on public.accounts;
create policy accounts_select_public on public.accounts
  for select using (status = 'AVAILABLE' or seller_id = auth.uid());

drop policy if exists accounts_insert_own on public.accounts;
create policy accounts_insert_own on public.accounts
  for insert with check (seller_id = auth.uid());

drop policy if exists accounts_update_own on public.accounts;
create policy accounts_update_own on public.accounts
  for update using (seller_id = auth.uid())
  with check (seller_id = auth.uid());

drop policy if exists accounts_delete_own on public.accounts;
create policy accounts_delete_own on public.accounts
  for delete using (seller_id = auth.uid());

-- credentials: only the seller ever sees the ciphertext.
drop policy if exists credentials_select_seller on public.credentials;
create policy credentials_select_seller on public.credentials
  for select using (seller_id = auth.uid());

drop policy if exists credentials_insert_seller on public.credentials;
create policy credentials_insert_seller on public.credentials
  for insert with check (seller_id = auth.uid());

drop policy if exists credentials_update_seller on public.credentials;
create policy credentials_update_seller on public.credentials
  for update using (seller_id = auth.uid())
  with check (seller_id = auth.uid());

drop policy if exists credentials_delete_seller on public.credentials;
create policy credentials_delete_seller on public.credentials
  for delete using (seller_id = auth.uid());

-- offer_reviews: world-readable, reviewer-writable.
drop policy if exists offer_reviews_select on public.offer_reviews;
create policy offer_reviews_select on public.offer_reviews
  for select using (true);

drop policy if exists offer_reviews_insert_own on public.offer_reviews;
create policy offer_reviews_insert_own on public.offer_reviews
  for insert with check (reviewer_id = auth.uid());

commit;
