-- 0010_orders_reveal_credentials.sql
--
-- Buyer-side credential reveal flow. Two parts:
--
-- 1. orders.revealed_at — nullable timestamptz, set on first reveal so the
--    UI can switch the button label "Reveal order details" → "View order
--    details" and skip the platform/region confirmation step on subsequent
--    views. Also serves as a simple audit field.
--
-- 2. reveal_credentials RPC — security definer, called by the server
--    action when the buyer confirms platform/region. Verifies caller is
--    the buyer of the order, reads the encrypted ciphertext from
--    credentials (bypassing the seller-only RLS), flips revealed_at on
--    first call, and returns (encrypted_data, was_already_revealed). The
--    Node-side action decrypts and ships plaintext to the buyer.

begin;

alter table public.orders
  add column if not exists revealed_at timestamptz;

create or replace function public.reveal_credentials(
  p_order_number text
)
returns table (encrypted_data text, was_already_revealed boolean)
language plpgsql
security definer
set search_path = public
as $$
declare
  v_buyer uuid := auth.uid();
  v_order_id uuid;
  v_account_id uuid;
  v_already_revealed boolean;
  v_encrypted text;
begin
  if v_buyer is null then
    raise exception 'Not authenticated';
  end if;

  select o.id, o.account_id, (o.revealed_at is not null)
    into v_order_id, v_account_id, v_already_revealed
  from public.orders o
  where o.order_number = p_order_number
    and o.buyer_id = v_buyer;

  if not found then
    raise exception 'Order not found';
  end if;

  select c.encrypted_data into v_encrypted
  from public.credentials c
  where c.account_id = v_account_id;

  if v_encrypted is null then
    raise exception 'No credentials available for this listing';
  end if;

  if not v_already_revealed then
    update public.orders
      set revealed_at = now()
      where id = v_order_id;
  end if;

  return query select v_encrypted, v_already_revealed;
end;
$$;

commit;
