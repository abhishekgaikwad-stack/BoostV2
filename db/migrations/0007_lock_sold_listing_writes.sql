-- 0007_lock_sold_listing_writes.sql
--
-- Once a listing is SOLD, the seller should not be able to edit or delete
-- it from the app. The order's FK is `on delete restrict` so deletes already
-- fail at the DB level if an order exists, but the message is cryptic.
-- Tighten the existing seller-side policies to require status = 'AVAILABLE'
-- so RLS rejects the write cleanly with the seller's normal error path.
--
-- The place_order RPC keeps working — it runs as security definer (postgres),
-- bypassing RLS for the SOLD flip. Same goes for any future security-definer
-- admin RPCs.

begin;

drop policy if exists accounts_update_own on public.accounts;
create policy accounts_update_own on public.accounts
  for update
  using (seller_id = auth.uid() and status = 'AVAILABLE')
  with check (seller_id = auth.uid());

drop policy if exists accounts_delete_own on public.accounts;
create policy accounts_delete_own on public.accounts
  for delete
  using (seller_id = auth.uid() and status = 'AVAILABLE');

commit;
