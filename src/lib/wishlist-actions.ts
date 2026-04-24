"use server";

import { revalidatePath } from "next/cache";
import { createSupabaseServerClient } from "@/lib/supabase/server";

export type ToggleWishlistResult =
  | { liked: boolean }
  | { error: "SIGN_IN_REQUIRED" | "UNKNOWN" };

/**
 * Flips the wishlist state for a single listing. Looks up the existing
 * row first so we can return the resulting state to the client (which uses
 * it to reconcile optimistic UI).
 */
export async function toggleWishlist(
  accountId: string,
): Promise<ToggleWishlistResult> {
  const supabase = await createSupabaseServerClient();
  const {
    data: { user },
  } = await supabase.auth.getUser();
  if (!user) return { error: "SIGN_IN_REQUIRED" };

  const { data: existing } = await supabase
    .from("wishlists")
    .select("user_id")
    .eq("user_id", user.id)
    .eq("account_id", accountId)
    .maybeSingle();

  if (existing) {
    const { error } = await supabase
      .from("wishlists")
      .delete()
      .eq("user_id", user.id)
      .eq("account_id", accountId);
    if (error) return { error: "UNKNOWN" };
    revalidatePath("/wishlist");
    return { liked: false };
  }

  const { error } = await supabase
    .from("wishlists")
    .insert({ user_id: user.id, account_id: accountId });
  if (error) return { error: "UNKNOWN" };
  revalidatePath("/wishlist");
  return { liked: true };
}
