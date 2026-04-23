-- 0002_drop_accounts_region_level_rank.sql
--
-- Drops the free-form `region`, `level`, `rank` text columns from
-- `accounts`. They were never surfaced in any structured way and only
-- existed as copy on the product card; going forward those details live
-- in `description` if the seller wants to mention them.
--
-- Re-defines `create_listings_bulk` so it no longer writes to the removed
-- columns.

begin;

-- --------------------------------------------------------------------------
-- accounts
-- --------------------------------------------------------------------------

alter table public.accounts drop column if exists region;
alter table public.accounts drop column if exists level;
alter table public.accounts drop column if exists rank;

-- --------------------------------------------------------------------------
-- create_listings_bulk  (replacement body without region/level/rank)
-- --------------------------------------------------------------------------

create or replace function public.create_listings_bulk(
  p_game_id uuid,
  p_listings jsonb
)
returns uuid[]
language plpgsql
security invoker
as $$
declare
  v_caller uuid := auth.uid();
  v_ids uuid[] := array[]::uuid[];
  v_item jsonb;
  v_account_id uuid;
begin
  if v_caller is null then
    raise exception 'Not authenticated';
  end if;

  for v_item in select * from jsonb_array_elements(p_listings)
  loop
    insert into public.accounts (
      game_id, seller_id, title, description,
      price, old_price, images, status
    ) values (
      p_game_id,
      v_caller,
      v_item->>'title',
      nullif(v_item->>'description', ''),
      (v_item->>'price')::int,
      nullif(v_item->>'old_price', '')::int,
      coalesce(
        array(select jsonb_array_elements_text(v_item->'images')),
        '{}'::text[]
      ),
      'AVAILABLE'
    )
    returning id into v_account_id;

    if (v_item->>'encrypted_credentials') is not null
       and length(v_item->>'encrypted_credentials') > 0 then
      insert into public.credentials (account_id, seller_id, encrypted_data)
      values (v_account_id, v_caller, v_item->>'encrypted_credentials');
    end if;

    v_ids := array_append(v_ids, v_account_id);
  end loop;

  return v_ids;
end;
$$;

commit;
