-- 0009_add_account_platform_region.sql
--
-- Adds two free-text qualifiers to listings: `platform` (e.g. PC, PS5,
-- Xbox, Mobile) and `region` (e.g. NA, EU, Asia). Surfaced in the seller
-- forms and shown in the buyer's pre-reveal confirmation step on the
-- order detail page ("I confirm platform [...] is correct").
--
-- Both columns are nullable so existing listings (which predate this
-- migration) don't fail validation. New listings can leave them blank
-- if the seller doesn't care to specify.

begin;

alter table public.accounts
  add column if not exists platform text,
  add column if not exists region text;

commit;
