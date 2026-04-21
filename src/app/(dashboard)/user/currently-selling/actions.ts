"use server";

import { revalidatePath } from "next/cache";
import { deleteObjectsByUrl } from "@/lib/s3";
import { createSupabaseServerClient } from "@/lib/supabase/server";

export type DeleteListingResult = { error?: string };

/**
 * Hard-deletes a listing the caller owns. The credentials row cascades via
 * the FK; S3 images are cleaned up best-effort so a storage failure doesn't
 * leave the buyer with a dead listing.
 */
export async function deleteListing(
  offerId: string,
): Promise<DeleteListingResult> {
  const supabase = await createSupabaseServerClient();
  const {
    data: { user },
  } = await supabase.auth.getUser();
  if (!user) return { error: "You must be signed in." };

  // Fetch ownership + image URLs in one round-trip.
  const { data: listing, error: fetchError } = await supabase
    .from("accounts")
    .select("id, seller_id, images, game:games(slug)")
    .eq("id", offerId)
    .maybeSingle();
  if (fetchError || !listing) return { error: "Listing not found." };
  if (listing.seller_id !== user.id) {
    return { error: "You can only delete your own listings." };
  }

  const { error: deleteError } = await supabase
    .from("accounts")
    .delete()
    .eq("id", offerId);
  if (deleteError) return { error: deleteError.message };

  // Fire-and-forget S3 cleanup — failures are logged but do not roll the DB
  // delete back. Orphans can be swept later via a lifecycle rule.
  const images = (listing.images as string[] | null) ?? [];
  if (images.length > 0) {
    try {
      await deleteObjectsByUrl(images);
    } catch (err) {
      console.warn("[delete-listing] S3 cleanup failed:", err);
    }
  }

  const gameSlug = (listing.game as unknown as { slug: string } | null)?.slug;
  revalidatePath("/user/currently-selling");
  revalidatePath("/");
  if (gameSlug) revalidatePath(`/games/${gameSlug}`);
  return {};
}
