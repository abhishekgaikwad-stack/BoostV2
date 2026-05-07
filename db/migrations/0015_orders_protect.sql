-- 0015_orders_protect.sql
--
-- Boost Protect — optional extended-warranty add-on selected by the buyer
-- on the PDP popup. Two new columns on `orders` plus a `place_order` RPC
-- that accepts the plan and computes the fee server-side. The fee is
-- computed against the *effective* price (post flash-discount) using the
-- same rule the RPC already uses to derive `price_cents`, so the protect
-- charge always matches what the buyer is paying for the listing.
--
-- Rates are duplicated in `src/lib/protect.ts` as a single source of truth
-- on the client side; this RPC is the authoritative server-side copy. Keep
-- them in sync — the rounding rule (`round(price_cents * rate)`) must
-- match exactly.
--
-- IDEMPOTENT: column adds use `if not exists`; the function uses
-- `create or replace`.

begin;

alter table public.orders
  add column if not exists protect_plan text
    check (protect_plan is null or protect_plan in ('3m','6m'));

alter table public.orders
  add column if not exists protect_fee_cents integer not null default 0
    check (protect_fee_cents >= 0);

create or replace function public.place_order(
  p_account_id uuid,
  p_payment_method text,
  p_protect_plan text default null
)
returns table(order_id text, transaction_id text)
language plpgsql security definer
set search_path = public
as $$
declare
  v_buyer uuid := auth.uid();
  v_account public.accounts%rowtype;
  v_order_uuid uuid := gen_random_uuid();
  v_order_number text;
  v_txn text;
  v_price integer;
  v_protect_fee integer;
begin
  if v_buyer is null then raise exception 'Not authenticated'; end if;
  if p_payment_method not in ('apple-pay','google-pay','visa','mastercard','paypal') then
    raise exception 'Invalid payment method';
  end if;
  if p_protect_plan is not null and p_protect_plan not in ('3m','6m') then
    raise exception 'Invalid protect plan';
  end if;

  select * into v_account from public.accounts where id = p_account_id for update;
  if not found then raise exception 'Listing not found'; end if;
  if v_account.status <> 'AVAILABLE' then raise exception 'Listing is not available'; end if;
  if v_account.seller_id = v_buyer then raise exception 'Cannot buy your own listing'; end if;

  v_price := case
    when v_account.discount_price is not null
      and v_account.discount_ends_at is not null
      and v_account.discount_ends_at > now()
    then v_account.discount_price
    else v_account.price
  end;

  -- Fee computed against the buyer's effective price. Rounding mirrors
  -- the JS helper in src/lib/protect.ts; both must agree to the cent.
  v_protect_fee := case p_protect_plan
    when '3m' then round(v_price * 0.10)::integer
    when '6m' then round(v_price * 0.14)::integer
    else 0
  end;

  loop
    v_order_number := 'o-' || lpad(floor(random() * 100000000)::int::text, 8, '0');
    v_txn := 't-' || lpad(floor(random() * 1000000000000::bigint)::bigint::text, 12, '0');
    begin
      insert into public.orders (
        id, buyer_id, seller_id, account_id,
        order_number, transaction_id,
        price_cents, payment_method, status,
        protect_plan, protect_fee_cents
      ) values (
        v_order_uuid, v_buyer, v_account.seller_id, p_account_id,
        v_order_number, v_txn,
        v_price, p_payment_method, 'PAID',
        p_protect_plan, v_protect_fee
      );
      exit;
    exception when unique_violation then
      v_order_uuid := gen_random_uuid();
    end;
  end loop;

  update public.accounts set status = 'SOLD' where id = p_account_id;

  return query select v_order_number, v_txn;
end;
$$;

commit;
