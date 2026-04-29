import type { MyReview } from "@/lib/review-types";
import { createSupabaseServerClient } from "@/lib/supabase/server";

export type { MyReview } from "@/lib/review-types";
export { isWithinEditWindow } from "@/lib/review-types";

export type ReviewSort = "newest" | "highest" | "lowest";
export const REVIEW_SORTS: ReviewSort[] = ["newest", "highest", "lowest"];
export const DEFAULT_REVIEW_LIMIT = 10;

export type SellerReviewStats = {
  avgRating: number;
  reviewCount: number;
  /** Counts keyed by star value 1..5. */
  distribution: Record<1 | 2 | 3 | 4 | 5, number>;
};

export type SellerReview = {
  id: string;
  rating: number;
  body: string | null;
  createdAt: string;
  updatedAt: string;
  reviewerName: string;
  offer: {
    id: string;
    title: string;
    gameSlug: string;
    gameName: string;
  } | null;
};

export type SellerReviewsPage = {
  items: SellerReview[];
  hasMore: boolean;
};

function emptyStats(): SellerReviewStats {
  return {
    avgRating: 0,
    reviewCount: 0,
    distribution: { 1: 0, 2: 0, 3: 0, 4: 0, 5: 0 },
  };
}

/**
 * Aggregate stats for a seller's reviews — average + count + per-star
 * distribution. Loads the rating column for every review (no SQL
 * aggregate to keep the helper simple); fine at marketplace scale, swap
 * for an RPC if a single seller ever crosses ~tens of thousands of rows.
 */
export async function getSellerReviewStats(
  sellerId: string,
): Promise<SellerReviewStats> {
  const supabase = await createSupabaseServerClient();
  const { data, error } = await supabase
    .from("offer_reviews")
    .select("rating")
    .eq("seller_id", sellerId);
  if (error || !data) return emptyStats();

  const distribution: SellerReviewStats["distribution"] = {
    1: 0,
    2: 0,
    3: 0,
    4: 0,
    5: 0,
  };
  let total = 0;
  for (const row of data) {
    const r = row.rating as number;
    if (r >= 1 && r <= 5) {
      distribution[r as 1 | 2 | 3 | 4 | 5] += 1;
      total += r;
    }
  }
  return {
    avgRating: data.length > 0 ? total / data.length : 0,
    reviewCount: data.length,
    distribution,
  };
}

const SELLER_REVIEW_SELECT = `
  id, rating, body, created_at, updated_at,
  reviewer:profiles!reviewer_id(id, name),
  offer:accounts(id, title, game:games(slug, name))
`;

type SellerReviewRow = {
  id: string;
  rating: number;
  body: string | null;
  created_at: string;
  updated_at: string;
  reviewer: { id: string; name: string | null } | null;
  offer:
    | {
        id: string;
        title: string;
        game: { slug: string; name: string };
      }
    | null;
};

function reviewerDisplayName(
  reviewer: { id: string; name: string | null } | null,
): string {
  if (reviewer?.name && reviewer.name.trim().length > 0) return reviewer.name;
  // Anonymous fallback — shows the profile id prefix so two reviewers
  // never collide in the UI.
  const id = reviewer?.id ?? "";
  const suffix = id.replace(/-/g, "").slice(0, 6);
  return suffix.length > 0 ? `User-${suffix}` : "User";
}

/**
 * Paginated seller-side review list. Pages are 0-indexed; `page=1` is the
 * second page. `hasMore` is computed by fetching `limit+1` rows and
 * trimming.
 */
export async function getSellerReviewsPage(input: {
  sellerId: string;
  sort?: ReviewSort;
  page?: number;
  limit?: number;
}): Promise<SellerReviewsPage> {
  const sort = input.sort ?? "newest";
  const limit = input.limit ?? DEFAULT_REVIEW_LIMIT;
  const page = input.page ?? 0;

  const supabase = await createSupabaseServerClient();
  let query = supabase
    .from("offer_reviews")
    .select(SELLER_REVIEW_SELECT)
    .eq("seller_id", input.sellerId);

  if (sort === "newest") {
    query = query.order("created_at", { ascending: false });
  } else if (sort === "highest") {
    query = query
      .order("rating", { ascending: false })
      .order("created_at", { ascending: false });
  } else {
    query = query
      .order("rating", { ascending: true })
      .order("created_at", { ascending: false });
  }

  const from = page * limit;
  const to = from + limit; // inclusive — fetches limit+1 rows
  query = query.range(from, to);

  const { data, error } = await query;
  if (error || !data) return { items: [], hasMore: false };

  const rows = data as unknown as SellerReviewRow[];
  const hasMore = rows.length > limit;
  const kept = hasMore ? rows.slice(0, limit) : rows;

  return {
    items: kept.map((row) => ({
      id: row.id,
      rating: row.rating,
      body: row.body,
      createdAt: row.created_at,
      updatedAt: row.updated_at,
      reviewerName: reviewerDisplayName(row.reviewer),
      offer: row.offer
        ? {
            id: row.offer.id,
            title: row.offer.title,
            gameSlug: row.offer.game.slug,
            gameName: row.offer.game.name,
          }
        : null,
    })),
    hasMore,
  };
}

/**
 * Returns the signed-in buyer's review on a given offer, or null if they
 * haven't reviewed it yet (or aren't signed in). Used by the order detail
 * page to render the "Your review" card.
 */
export async function getMyReviewForOffer(
  offerId: string,
): Promise<MyReview | null> {
  const supabase = await createSupabaseServerClient();
  const {
    data: { user },
  } = await supabase.auth.getUser();
  if (!user) return null;

  const { data, error } = await supabase
    .from("offer_reviews")
    .select("id, rating, body, created_at, updated_at")
    .eq("offer_id", offerId)
    .eq("reviewer_id", user.id)
    .maybeSingle();

  if (error || !data) return null;
  return {
    id: data.id as string,
    rating: data.rating as number,
    body: (data.body as string | null) ?? null,
    createdAt: data.created_at as string,
    updatedAt: data.updated_at as string,
  };
}
