-- 0013_offer_reviews_constraints.sql
--
-- Lock down offer_reviews for the buyer review flow:
--
-- * UNIQUE (offer_id, reviewer_id) — one review per buyer per listing.
--   Subsequent submits become updates of the same row.
-- * CHECK on body length (≤ 1500 chars).
-- * `updated_at` column + bump trigger (reuses touch_updated_at from
--   0001_baseline.sql). Public reads can show "(edited)" when this
--   diverges from created_at.
-- * RLS update / delete policies for the reviewer's own rows.
-- * `submit_review` RPC (security definer) — gates on the caller having
--   any order on this offer; rejects edits past 30 days from creation.

begin;

alter table public.offer_reviews
  add column if not exists updated_at timestamptz not null default now();

alter table public.offer_reviews
  drop constraint if exists offer_reviews_body_length;
alter table public.offer_reviews
  add constraint offer_reviews_body_length check (
    body is null or char_length(body) <= 1500
  );

alter table public.offer_reviews
  drop constraint if exists offer_reviews_unique_buyer;
alter table public.offer_reviews
  add constraint offer_reviews_unique_buyer unique (offer_id, reviewer_id);

-- Defined in 0001_baseline.sql, but recreated here defensively for DBs
-- that predate the baseline (the architecture doc flags this as possible
-- since 0001 is a reconstructed baseline).
create or replace function public.touch_updated_at()
returns trigger language plpgsql as $$
begin
  new.updated_at = now();
  return new;
end;
$$;

drop trigger if exists offer_reviews_touch_updated_at on public.offer_reviews;
create trigger offer_reviews_touch_updated_at
  before update on public.offer_reviews
  for each row execute function public.touch_updated_at();

drop policy if exists offer_reviews_update_own on public.offer_reviews;
create policy offer_reviews_update_own on public.offer_reviews
  for update using (reviewer_id = auth.uid())
  with check (reviewer_id = auth.uid());

drop policy if exists offer_reviews_delete_own on public.offer_reviews;
create policy offer_reviews_delete_own on public.offer_reviews
  for delete using (reviewer_id = auth.uid());

create or replace function public.submit_review(
  p_offer_id uuid,
  p_rating integer,
  p_body text
)
returns uuid
language plpgsql
security definer
set search_path = public
as $$
declare
  v_buyer uuid := auth.uid();
  v_existing_id uuid;
  v_existing_created timestamptz;
  v_id uuid;
begin
  if v_buyer is null then
    raise exception 'Not authenticated';
  end if;
  if p_rating < 1 or p_rating > 5 then
    raise exception 'Rating must be between 1 and 5';
  end if;
  if p_body is not null and char_length(p_body) > 1500 then
    raise exception 'Review cannot exceed 1500 characters';
  end if;

  -- Verified-buyer gate: the caller must have at least one order on this
  -- listing, regardless of status. Reviewer_id matches buyer_id.
  if not exists (
    select 1 from public.orders
    where account_id = p_offer_id and buyer_id = v_buyer
  ) then
    raise exception 'Only verified buyers can review this listing';
  end if;

  select id, created_at
    into v_existing_id, v_existing_created
  from public.offer_reviews
  where offer_id = p_offer_id and reviewer_id = v_buyer;

  if v_existing_id is not null then
    if now() - v_existing_created > interval '30 days' then
      raise exception 'Reviews can only be edited within 30 days of creation';
    end if;
    update public.offer_reviews
      set rating = p_rating,
          body = p_body
      where id = v_existing_id;
    v_id := v_existing_id;
  else
    insert into public.offer_reviews (offer_id, reviewer_id, rating, body)
    values (p_offer_id, v_buyer, p_rating, p_body)
    returning id into v_id;
  end if;

  return v_id;
end;
$$;

commit;
