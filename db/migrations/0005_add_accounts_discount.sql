-- 0005_add_accounts_discount.sql
--
-- Seller-run flash discount. Two new columns on `accounts`:
--   discount_price (int cents, nullable)
--   discount_ends_at (timestamptz, nullable)
-- Semantics: when `discount_ends_at > now()`, the effective selling price is
-- `discount_price`; once it passes, reads naturally revert to `price`. No
-- cron needed — expiry is derived at read time.
--
-- The `discount_price < price` rule is enforced in the server action, not in
-- a CHECK, so later edits that drop `price` don't collide with a still-active
-- discount (a weird but non-fatal state). The CHECK here just guarantees the
-- two columns stay consistent (both set or both null).

begin;

alter table public.accounts
  add column if not exists discount_price integer,
  add column if not exists discount_ends_at timestamptz;

alter table public.accounts
  drop constraint if exists accounts_discount_both_or_neither;
alter table public.accounts
  add constraint accounts_discount_both_or_neither check (
    (discount_price is null and discount_ends_at is null) or
    (discount_price is not null and discount_ends_at is not null)
  );

alter table public.accounts
  drop constraint if exists accounts_discount_price_nonneg;
alter table public.accounts
  add constraint accounts_discount_price_nonneg check (
    discount_price is null or discount_price >= 0
  );

commit;
