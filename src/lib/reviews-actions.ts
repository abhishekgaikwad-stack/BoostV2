"use server";

import { revalidatePath } from "next/cache";
import { createSupabaseServerClient } from "@/lib/supabase/server";

export type SubmitReviewResult =
  | { ok: true; reviewId: string }
  | { error: string };

/**
 * Submits (or edits) the buyer's review for the order's listing. Looks up
 * the offer_id from the order, then calls the security-definer
 * `submit_review` RPC which gates on the buyer having an order on that
 * offer and rejects edits past 30 days from creation. On success, the
 * order detail page is revalidated so the buyer sees their review
 * inline immediately.
 */
export async function submitReview(input: {
  orderId: string;
  rating: number;
  body?: string;
}): Promise<SubmitReviewResult> {
  const supabase = await createSupabaseServerClient();
  const {
    data: { user },
  } = await supabase.auth.getUser();
  if (!user) return { error: "Sign in to leave a review." };

  if (!Number.isInteger(input.rating) || input.rating < 1 || input.rating > 5) {
    return { error: "Rating must be between 1 and 5." };
  }

  const trimmedBody =
    input.body && input.body.trim().length > 0 ? input.body.trim() : null;
  if (trimmedBody && trimmedBody.length > 1500) {
    return { error: "Review cannot exceed 1500 characters." };
  }

  const { data: order, error: lookupError } = await supabase
    .from("orders")
    .select("account_id")
    .eq("order_number", input.orderId)
    .eq("buyer_id", user.id)
    .maybeSingle();
  if (lookupError || !order?.account_id) {
    return { error: "Order not found." };
  }

  const { data, error } = await supabase.rpc("submit_review", {
    p_offer_id: order.account_id as string,
    p_rating: input.rating,
    p_body: trimmedBody,
  });
  if (error) return { error: error.message };

  revalidatePath(`/orders/${input.orderId}`);
  return { ok: true, reviewId: data as string };
}
