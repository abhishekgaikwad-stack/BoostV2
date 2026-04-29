import type { MyReview } from "@/lib/review-types";
import { createSupabaseServerClient } from "@/lib/supabase/server";

export type { MyReview } from "@/lib/review-types";
export { isWithinEditWindow } from "@/lib/review-types";

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
