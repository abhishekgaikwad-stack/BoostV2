-- 0006_orders.sql
--
-- Buyer→listing transactional record. One row per completed (or pending)
-- purchase. Created exclusively via the `place_order` RPC, which atomically
-- validates the listing, inserts the order, and flips `accounts.status` to
-- SOLD so a second buyer can't reach the same row. Status defaults to PAID
-- for the current stub flow; once Stripe is wired the RPC will insert
-- PENDING and a webhook will flip to PAID on `checkout.session.completed`.
--
-- Reads:
--   * Buyer can select their own orders (RLS).
--   * Seller can select orders on their listings (RLS, via denormalized seller_id).
--   * Once a listing flips to SOLD the existing accounts_select_public policy
--     hides it from the buyer too. We add `accounts_select_buyer` so the
--     buyer can still see the listing they purchased on the success page.

begin;

create table if not exists public.orders (
  id uuid primary key default gen_random_uuid(),
  buyer_id uuid not null references auth.users(id) on delete restrict,
  seller_id uuid not null references auth.users(id) on delete restrict,
  account_id uuid not null references public.accounts(id) on delete restrict,
  transaction_id text not null unique,
  price_cents integer not null check (price_cents >= 0),
  payment_method text not null check (
    payment_method in ('apple-pay', 'google-pay', 'visa', 'mastercard', 'paypal')
  ),
  status text not null default 'PAID' check (
    status in ('PENDING', 'PAID', 'DELIVERED', 'REFUNDED')
  ),
  created_at timestamptz not null default now()
);

create index if not exists idx_orders_buyer_created
  on public.orders (buyer_id, created_at desc);

create index if not exists idx_orders_seller_created
  on public.orders (seller_id, created_at desc);

-- --------------------------------------------------------------------------
-- Row-Level Security
-- --------------------------------------------------------------------------

alter table public.orders enable row level security;

drop policy if exists orders_select_buyer on public.orders;
create policy orders_select_buyer on public.orders
  for select using (buyer_id = auth.uid());

drop policy if exists orders_select_seller on public.orders;
create policy orders_select_seller on public.orders
  for select using (seller_id = auth.uid());

-- No INSERT/UPDATE/DELETE policies — every mutation flows through
-- place_order (security definer). Anon and authenticated roles cannot write.

-- Let the buyer read the SOLD listing they bought, so the success page can
-- render the offer snapshot. Multiple SELECT policies are OR'd, so this
-- co-exists with accounts_select_public.
drop policy if exists accounts_select_buyer on public.accounts;
create policy accounts_select_buyer on public.accounts
  for select using (
    exists (
      select 1 from public.orders
      where orders.account_id = accounts.id
        and orders.buyer_id = auth.uid()
    )
  );

-- --------------------------------------------------------------------------
-- place_order(p_account_id uuid, p_payment_method text)
-- --------------------------------------------------------------------------
-- Atomic: validate listing is AVAILABLE, snapshot effective price (honors
-- active flash discount), insert order as PAID, flip listing to SOLD.
-- Generates `txn_<hex>` server-side.

create or replace function public.place_order(
  p_account_id uuid,
  p_payment_method text
)
returns table (order_id uuid, transaction_id text)
language plpgsql
security definer
set search_path = public
as $$
declare
  v_buyer uuid := auth.uid();
  v_account public.accounts%rowtype;
  v_order_id uuid := gen_random_uuid();
  v_txn text := 'txn_' || encode(gen_random_bytes(8), 'hex');
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

  insert into public.orders (
    id, buyer_id, seller_id, account_id,
    transaction_id, price_cents, payment_method, status
  ) values (
    v_order_id, v_buyer, v_account.seller_id, p_account_id,
    v_txn, v_price, p_payment_method, 'PAID'
  );

  update public.accounts
    set status = 'SOLD'
    where id = p_account_id;

  return query select v_order_id, v_txn;
end;
$$;

commit;
