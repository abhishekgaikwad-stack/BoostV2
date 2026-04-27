-- 0011_create_listings_bulk_with_platform_region.sql
--
-- Refresh create_listings_bulk so it writes the new accounts.platform and
-- accounts.region columns added in 0009. Function signature is unchanged
-- (CREATE OR REPLACE is enough — no drop needed). Existing callers keep
-- working; new callers can include "platform" / "region" keys in the
-- per-row JSON.

begin;

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
      platform, region,
      price, old_price, images, status
    ) values (
      p_game_id,
      v_caller,
      v_item->>'title',
      nullif(v_item->>'description', ''),
      nullif(v_item->>'platform', ''),
      nullif(v_item->>'region', ''),
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
