-- 0012_orders_received_confirmation.sql
--
-- Buyer confirmation that the credentials they revealed actually worked.
-- Two new columns on `orders`:
--
--   marked_received_at — timestamptz, set on first successful mark.
--   received_checks    — jsonb snapshot of the four (or three when email
--                        credentials weren't included) confirmation flags
--                        the buyer ticked: account_info_works,
--                        matches_description, email_access, password_changed.
--                        Stored verbatim so disputes can audit exactly what
--                        the buyer agreed to.
--
-- Status enum is left untouched; this is orthogonal to the payment
-- lifecycle (PENDING/PAID/DELIVERED/REFUNDED). A future "DELIVERED" might
-- still flip independently when seller-side delivery flows ship.
--
-- Writes flow through the mark_order_received RPC (security definer) so
-- we can keep the no-INSERT/UPDATE/DELETE-policies posture on orders.

begin;

alter table public.orders
  add column if not exists marked_received_at timestamptz,
  add column if not exists received_checks jsonb;

create or replace function public.mark_order_received(
  p_order_number text,
  p_checks jsonb
)
returns void
language plpgsql
security definer
set search_path = public
as $$
declare
  v_buyer uuid := auth.uid();
  v_updated int;
begin
  if v_buyer is null then
    raise exception 'Not authenticated';
  end if;

  update public.orders
    set marked_received_at = now(),
        received_checks = p_checks
    where order_number = p_order_number
      and buyer_id = v_buyer
      and marked_received_at is null;

  get diagnostics v_updated = row_count;
  if v_updated = 0 then
    raise exception 'Order not found or already marked received';
  end if;
end;
$$;

commit;
