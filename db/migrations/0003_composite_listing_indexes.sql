-- 0003_composite_listing_indexes.sql
--
-- Upgrades the three listing indexes into composites that cover both the
-- WHERE filter and the ORDER BY in one index scan, and add `id DESC` as a
-- stable tie-breaker for cursor pagination.
--
--   (game_id, status, created_at DESC, id DESC)   <- game-detail feed
--   (seller_id, status, created_at DESC, id DESC) <- seller-page feed
--   (status, created_at DESC, id DESC)            <- home / recent feed
--
-- The old two-column versions (`idx_accounts_game_status`, `idx_accounts_seller`)
-- are redundant with the new composites and get dropped.
--
-- Note on scale: at low-medium volume the non-concurrent CREATE INDEX below
-- is fine. When the table grows past a few hundred thousand rows and writes
-- matter, rewrite future index migrations as `CREATE INDEX CONCURRENTLY`
-- outside a transaction block to avoid blocking writes.

begin;

-- --------------------------------------------------------------------------
-- New composites
-- --------------------------------------------------------------------------

create index if not exists idx_accounts_game_status_created
  on public.accounts (game_id, status, created_at desc, id desc);

create index if not exists idx_accounts_seller_status_created
  on public.accounts (seller_id, status, created_at desc, id desc);

-- Replace the existing `(status, created_at DESC)` with a version that
-- includes `id DESC` as a tie-breaker for cursor pagination.
drop index if exists public.idx_accounts_status_created;
create index if not exists idx_accounts_status_created
  on public.accounts (status, created_at desc, id desc);

-- --------------------------------------------------------------------------
-- Drop redundant narrower indexes
-- --------------------------------------------------------------------------

drop index if exists public.idx_accounts_game_status;
drop index if exists public.idx_accounts_seller;

commit;
