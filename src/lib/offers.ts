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

type AccountRow = {
  id: string;
  title: string;
  description: string | null;
  region: string | null;
  level: string | null;
  rank: string | null;
  price: number;
  old_price: number | null;
  images: string[];
  status: "AVAILABLE" | "RESERVED" | "SOLD";
  offer_ends_at: string | null;
  created_at: string;
  game: GameRow;
  seller: SellerRow;
};

const ACCOUNT_SELECT = `
  id, title, description, region, level, rank,
  price, old_price, images, status, offer_ends_at, created_at,
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

function toAccount(row: AccountRow): Account {
  return {
    id: row.id,
    game: toGame(row.game),
    seller: {
      id: row.seller.id,
      name: row.seller.name ?? "Seller",
    },
    title: row.title,
    region: row.region ?? "",
    level: row.level ?? "",
    rank: row.rank ?? "",
    price: row.price / 100,
    oldPrice: row.old_price != null ? row.old_price / 100 : undefined,
  };
}

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

export async function offersForGame(gameSlug: string): Promise<Account[]> {
  const supabase = await createSupabaseServerClient();
  const { data, error } = await supabase
    .from("accounts")
    .select(ACCOUNT_SELECT)
    .eq("status", "AVAILABLE")
    .eq("game.slug", gameSlug)
    .order("created_at", { ascending: false });
  if (error || !data) return [];
  return (data as unknown as AccountRow[])
    .filter((row) => row.game?.slug === gameSlug)
    .map(toAccount);
}

export async function offersForSeller(storeId: number): Promise<Account[]> {
  const supabase = await createSupabaseServerClient();
  const { data, error } = await supabase
    .from("accounts")
    .select(ACCOUNT_SELECT)
    .eq("seller.store_id", storeId)
    .eq("status", "AVAILABLE")
    .order("created_at", { ascending: false });
  if (error || !data) return [];
  return (data as unknown as AccountRow[])
    .filter((row) => row.seller?.store_id === storeId)
    .map(toAccount);
}

export async function similarOffers(
  gameSlug: string,
  excludeId: string,
  take = 5,
): Promise<Account[]> {
  const rows = await offersForGame(gameSlug);
  return rows.filter((row) => row.id !== excludeId).slice(0, take);
}

export async function recentOffers(limit = 10): Promise<Account[]> {
  const supabase = await createSupabaseServerClient();
  const { data, error } = await supabase
    .from("accounts")
    .select(ACCOUNT_SELECT)
    .eq("status", "AVAILABLE")
    .order("created_at", { ascending: false })
    .limit(limit);
  if (error || !data) return [];
  return (data as unknown as AccountRow[]).map(toAccount);
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
