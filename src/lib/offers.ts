import { createSupabaseServerClient } from "@/lib/supabase/server";
import type { Account, Game, Offer, OfferReview } from "@/types";

// ---------- Supabase row shapes ----------

type GameRow = {
  id: string;
  slug: string;
  name: string;
  subtitle: string | null;
  cover: string | null;
};

type SellerRow = {
  id: string;
  name: string | null;
  avatar_url: string | null;
  store_id: number | null;
};

export type AccountRow = {
  id: string;
  title: string;
  description: string | null;
  price: number;
  old_price: number | null;
  discount_price: number | null;
  discount_ends_at: string | null;
  images: string[];
  status: "AVAILABLE" | "RESERVED" | "SOLD";
  offer_ends_at: string | null;
  created_at: string;
  game: GameRow;
  seller: SellerRow;
};

export const ACCOUNT_SELECT = `
  id, title, description,
  price, old_price, discount_price, discount_ends_at,
  images, status, offer_ends_at, created_at,
  game:games(id, slug, name, subtitle, cover),
  seller:profiles(id, name, avatar_url, store_id)
`;

// ---------- Mappers ----------

function toGame(row: GameRow): Game {
  return {
    id: row.id,
    slug: row.slug,
    name: row.name,
    subtitle: row.subtitle ?? undefined,
    cover: row.cover ?? row.slug,
  };
}

export function toAccount(row: AccountRow): Account {
  // A flash discount is "active" until its end timestamp passes. When active,
  // we promote `discount_price` to the effective selling price; `old_price`
  // (MRP) stays in the struck-through slot, so the card naturally renders
  // discount-vs-MRP. When inactive, reads revert to the regular `price`.
  const discountActive =
    row.discount_price != null &&
    row.discount_ends_at != null &&
    new Date(row.discount_ends_at).getTime() > Date.now();

  const effectiveCents = discountActive ? row.discount_price! : row.price;

  return {
    id: row.id,
    game: toGame(row.game),
    seller: {
      id: row.seller.id,
      name: row.seller.name ?? "Seller",
    },
    title: row.title,
    price: effectiveCents / 100,
    oldPrice: row.old_price != null ? row.old_price / 100 : undefined,
    discountEndsAt: discountActive ? row.discount_ends_at! : undefined,
    images: row.images ?? [],
  };
}

// ---------- Cursor pagination ----------

/**
 * Opaque cursor encoding the last row's `(created_at, id)` tuple. Callers
 * treat it as a black-box string: pass it back verbatim as the next call's
 * `cursor` to get the following page.
 */
export type ListingCursor = string;

export type ListingPage = {
  items: Account[];
  nextCursor: ListingCursor | null;
};

export type CursorPayload = { c: string; i: string };

export function encodeCursor(payload: CursorPayload): ListingCursor {
  return Buffer.from(JSON.stringify(payload), "utf8").toString("base64url");
}

export function decodeCursor(cursor: ListingCursor): CursorPayload | null {
  try {
    const obj = JSON.parse(
      Buffer.from(cursor, "base64url").toString("utf8"),
    ) as Partial<CursorPayload>;
    if (typeof obj.c === "string" && typeof obj.i === "string") {
      return { c: obj.c, i: obj.i };
    }
    return null;
  } catch {
    return null;
  }
}

/**
 * Apply a keyset (`created_at DESC, id DESC`) cursor to a query builder.
 * Requires the caller to also append matching `.order(...)` clauses.
 */
function withCursor<Q extends { or: (filter: string) => Q }>(
  query: Q,
  cursor: ListingCursor | null | undefined,
): Q {
  if (!cursor) return query;
  const payload = decodeCursor(cursor);
  if (!payload) return query;
  return query.or(
    `created_at.lt.${payload.c},and(created_at.eq.${payload.c},id.lt.${payload.i})`,
  );
}

/**
 * Fetches `limit + 1` rows so we can detect whether a next page exists, then
 * trims back to `limit` and builds the next cursor from the last kept row.
 */
function buildPage(rows: AccountRow[], limit: number): ListingPage {
  const hasMore = rows.length > limit;
  const kept = hasMore ? rows.slice(0, limit) : rows;
  const last = kept[kept.length - 1];
  return {
    items: kept.map(toAccount),
    nextCursor:
      hasMore && last ? encodeCursor({ c: last.created_at, i: last.id }) : null,
  };
}

export type ListingQuery = {
  limit?: number;
  cursor?: ListingCursor | null;
};

const DEFAULT_LISTING_LIMIT = 24;

// ---------- Queries ----------

export async function findGameBySlug(slug: string): Promise<Game | null> {
  const supabase = await createSupabaseServerClient();
  const { data, error } = await supabase
    .from("games")
    .select("id, slug, name, subtitle, cover")
    .eq("slug", slug)
    .maybeSingle();
  if (error || !data) return null;
  return toGame(data);
}

export async function listGames(limit = 14): Promise<Game[]> {
  const supabase = await createSupabaseServerClient();
  const { data, error } = await supabase
    .from("games")
    .select("id, slug, name, subtitle, cover")
    .order("name")
    .limit(limit);
  if (error || !data) return [];
  return data.map(toGame);
}

export async function offersForGame(
  gameSlug: string,
  { limit = DEFAULT_LISTING_LIMIT, cursor = null }: ListingQuery = {},
): Promise<ListingPage> {
  const supabase = await createSupabaseServerClient();
  const query = withCursor(
    supabase
      .from("accounts")
      .select(ACCOUNT_SELECT)
      .eq("status", "AVAILABLE")
      .eq("game.slug", gameSlug)
      .order("created_at", { ascending: false })
      .order("id", { ascending: false })
      .limit(limit + 1),
    cursor,
  );
  const { data, error } = await query;
  if (error || !data) return { items: [], nextCursor: null };
  // Defensive post-filter — the `game.slug` filter already runs SQL-side, but
  // PostgREST relation filtering has edge cases. Filtered-out rows can mask a
  // `hasMore` signal at the page boundary; acceptable given how rare this is.
  const rows = (data as unknown as AccountRow[]).filter(
    (row) => row.game?.slug === gameSlug,
  );
  return buildPage(rows, limit);
}

export async function offersForSeller(
  storeId: number,
  { limit = DEFAULT_LISTING_LIMIT, cursor = null }: ListingQuery = {},
): Promise<ListingPage> {
  const supabase = await createSupabaseServerClient();
  const query = withCursor(
    supabase
      .from("accounts")
      .select(ACCOUNT_SELECT)
      .eq("seller.store_id", storeId)
      .eq("status", "AVAILABLE")
      .order("created_at", { ascending: false })
      .order("id", { ascending: false })
      .limit(limit + 1),
    cursor,
  );
  const { data, error } = await query;
  if (error || !data) return { items: [], nextCursor: null };
  const rows = (data as unknown as AccountRow[]).filter(
    (row) => row.seller?.store_id === storeId,
  );
  return buildPage(rows, limit);
}

export async function similarOffers(
  gameSlug: string,
  excludeId: string,
  take = 5,
): Promise<Account[]> {
  // +1 so we still have `take` items even if the excluded row sits in the page.
  const { items } = await offersForGame(gameSlug, { limit: take + 1 });
  return items.filter((row) => row.id !== excludeId).slice(0, take);
}

export async function recentOffers(
  { limit = 10, cursor = null }: ListingQuery = {},
): Promise<ListingPage> {
  const supabase = await createSupabaseServerClient();
  const query = withCursor(
    supabase
      .from("accounts")
      .select(ACCOUNT_SELECT)
      .eq("status", "AVAILABLE")
      .order("created_at", { ascending: false })
      .order("id", { ascending: false })
      .limit(limit + 1),
    cursor,
  );
  const { data, error } = await query;
  if (error || !data) return { items: [], nextCursor: null };
  return buildPage(data as unknown as AccountRow[], limit);
}

export async function firstFlashOffer(): Promise<Account | null> {
  const supabase = await createSupabaseServerClient();
  const { data, error } = await supabase
    .from("accounts")
    .select(ACCOUNT_SELECT)
    .eq("status", "AVAILABLE")
    .not("old_price", "is", null)
    .order("created_at", { ascending: false })
    .limit(1)
    .maybeSingle();
  if (error || !data) return null;
  return toAccount(data as unknown as AccountRow);
}

export async function findOfferById(offerId: string): Promise<Account | null> {
  const supabase = await createSupabaseServerClient();
  const { data, error } = await supabase
    .from("accounts")
    .select(ACCOUNT_SELECT)
    .eq("id", offerId)
    .maybeSingle();
  if (error || !data) return null;
  return toAccount(data as unknown as AccountRow);
}

export async function findOffer(
  gameSlug: string,
  offerId: string,
): Promise<Offer | null> {
  const supabase = await createSupabaseServerClient();
  const { data, error } = await supabase
    .from("accounts")
    .select(ACCOUNT_SELECT)
    .eq("id", offerId)
    .maybeSingle();
  if (error || !data) return null;
  const row = data as unknown as AccountRow;
  if (row.game?.slug !== gameSlug) return null;

  const account = toAccount(row);

  // Reviews — join via offer_reviews (currently empty until anyone writes one)
  const reviews = await fetchOfferReviews(row.id);

  return {
    ...account,
    description: row.description ?? "",
    images: row.images ?? [],
    seller: {
      ...account.seller,
      avatarUrl: row.seller.avatar_url ?? undefined,
      isOnline: true,
      rating: 0,
      reviewCount: reviews.length,
      storeId: row.seller.store_id ?? undefined,
    },
    reviews,
    offerEndsAt: row.offer_ends_at ?? undefined,
  };
}

// ---------- Reviews ----------

type ReviewRow = {
  id: string;
  rating: number;
  body: string | null;
  created_at: string;
  reviewer: { id: string; name: string | null };
};

async function fetchOfferReviews(offerId: string): Promise<OfferReview[]> {
  const supabase = await createSupabaseServerClient();
  const { data, error } = await supabase
    .from("offer_reviews")
    .select(
      "id, rating, body, created_at, reviewer:profiles!offer_reviews_reviewer_id_fkey(id, name)",
    )
    .eq("offer_id", offerId)
    .order("created_at", { ascending: false })
    .limit(10);
  if (error || !data) return [];
  return (data as unknown as ReviewRow[]).map((r) => ({
    id: r.id,
    rating: r.rating,
    body: r.body ?? "",
    date: new Date(r.created_at).toLocaleDateString(undefined, {
      day: "numeric",
      month: "long",
      year: "numeric",
    }),
    user: r.reviewer?.name ?? "Anonymous",
    userSubtitle: "Buyer",
  }));
}
