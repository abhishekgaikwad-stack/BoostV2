-- 0004_wishlists.sql
--
-- Per-user wishlist. Join table between `auth.users` and `public.accounts`.
-- Composite primary key prevents duplicates; RLS ensures a user can only
-- see and mutate their own rows.
--
-- Indexing:
--   * PK (user_id, account_id) — covers "is this listing in my wishlist".
--   * idx_wishlists_user_created — covers the wishlist page feed, which is
--     ordered by `created_at DESC` with `account_id DESC` as a stable
--     tie-breaker for cursor pagination (mirrors accounts indexes).

begin;

create table if not exists public.wishlists (
  user_id    uuid not null references auth.users(id)       on delete cascade,
  account_id uuid not null references public.accounts(id)  on delete cascade,
  created_at timestamptz not null default now(),
  primary key (user_id, account_id)
);

create index if not exists idx_wishlists_user_created
  on public.wishlists (user_id, created_at desc, account_id desc);

-- --------------------------------------------------------------------------
-- Row-Level Security
-- --------------------------------------------------------------------------

alter table public.wishlists enable row level security;

drop policy if exists wishlists_select_own on public.wishlists;
create policy wishlists_select_own on public.wishlists
  for select using (user_id = auth.uid());

drop policy if exists wishlists_insert_own on public.wishlists;
create policy wishlists_insert_own on public.wishlists
  for insert with check (user_id = auth.uid());

drop policy if exists wishlists_delete_own on public.wishlists;
create policy wishlists_delete_own on public.wishlists
  for delete using (user_id = auth.uid());

commit;
