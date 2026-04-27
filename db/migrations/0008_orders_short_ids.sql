-- 0008_orders_short_ids.sql
--
-- Replace the UUID-based public order/transaction identifiers with the
-- short, human-friendly formats the UI now displays:
--   * order_number: 'o-' + 8 random digits (e.g. o-12345678)
--   * transaction_id: 't-' + 12 random digits (e.g. t-123456789101)
--
-- The internal `orders.id` UUID PK stays in place — keeping it avoids
-- rewriting FK shapes, RLS policies, and the URL→DB lookup contract for
-- anything we later reference by uuid. The app talks to the new
-- order_number via `id:order_number` aliases in its SELECTs, so URLs and
-- displayed IDs align.

begin;

-- --------------------------------------------------------------------------
-- 1. order_number column (nullable while we backfill)
-- --------------------------------------------------------------------------

alter table public.orders
  add column if not exists order_number text;

-- --------------------------------------------------------------------------
-- 2. Backfill existing rows
-- --------------------------------------------------------------------------

do $$
declare
  r record;
  candidate text;
begin
  for r in
    select id from public.orders where order_number is null
  loop
    loop
      candidate := 'o-' || lpad(floor(random() * 100000000)::int::text, 8, '0');
      exit when not exists (
        select 1 from public.orders where order_number = candidate
      );
    end loop;
    update public.orders set order_number = candidate where id = r.id;
  end loop;
end $$;

do $$
declare
  r record;
  candidate text;
begin
  for r in
    select id from public.orders where transaction_id !~ '^t-\d{12}$'
  loop
    loop
      candidate := 't-' || lpad(floor(random() * 1000000000000::bigint)::bigint::text, 12, '0');
      exit when not exists (
        select 1 from public.orders where transaction_id = candidate
      );
    end loop;
    update public.orders set transaction_id = candidate where id = r.id;
  end loop;
end $$;

-- --------------------------------------------------------------------------
-- 3. Tighten constraints
-- --------------------------------------------------------------------------

alter table public.orders
  alter column order_number set not null;

alter table public.orders
  drop constraint if exists orders_order_number_unique;
alter table public.orders
  add constraint orders_order_number_unique unique (order_number);

-- --------------------------------------------------------------------------
-- 4. Refresh place_order to emit the new formats
-- --------------------------------------------------------------------------
-- The function now returns (order_id text, transaction_id text), where
-- order_id is the public order_number — that's what the app navigates with.
-- The return-type changed (was uuid for order_id), so we have to DROP first;
-- CREATE OR REPLACE refuses to change OUT-parameter types.

drop function if exists public.place_order(uuid, text);

create function public.place_order(
  p_account_id uuid,
  p_payment_method text
)
returns table (order_id text, transaction_id text)
language plpgsql
security definer
set search_path = public
as $$
declare
  v_buyer uuid := auth.uid();
  v_account public.accounts%rowtype;
  v_order_uuid uuid := gen_random_uuid();
  v_order_number text;
  v_txn text;
  v_price integer;
begin
  if v_buyer is null then
    raise exception 'Not authenticated';
  end if;
  if p_payment_method not in ('apple-pay', 'google-pay', 'visa', 'mastercard', 'paypal') then
    raise exception 'Invalid payment method';
  end if;

  select * into v_account
  from public.accounts
  where id = p_account_id
  for update;

  if not found then
    raise exception 'Listing not found';
  end if;
  if v_account.status <> 'AVAILABLE' then
    raise exception 'Listing is not available';
  end if;
  if v_account.seller_id = v_buyer then
    raise exception 'Cannot buy your own listing';
  end if;

  v_price := case
    when v_account.discount_price is not null
      and v_account.discount_ends_at is not null
      and v_account.discount_ends_at > now()
    then v_account.discount_price
    else v_account.price
  end;

  -- Generate the public ids, retrying on the off-chance of a collision.
  -- 1e8 / 1e12 spaces make this loop essentially run once.
  loop
    v_order_number := 'o-' || lpad(floor(random() * 100000000)::int::text, 8, '0');
    v_txn := 't-' || lpad(floor(random() * 1000000000000::bigint)::bigint::text, 12, '0');
    begin
      insert into public.orders (
        id, buyer_id, seller_id, account_id,
        order_number, transaction_id,
        price_cents, payment_method, status
      ) values (
        v_order_uuid, v_buyer, v_account.seller_id, p_account_id,
        v_order_number, v_txn,
        v_price, p_payment_method, 'PAID'
      );
      exit;
    exception when unique_violation then
      v_order_uuid := gen_random_uuid();
      -- order_number / transaction_id will be regenerated on next iteration
    end;
  end loop;

  update public.accounts
    set status = 'SOLD'
    where id = p_account_id;

  return query select v_order_number, v_txn;
end;
$$;

commit;
