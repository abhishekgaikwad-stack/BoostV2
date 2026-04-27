"use server";

import { revalidatePath } from "next/cache";
import {
  credentialsFromFormData,
  saveCredentials,
} from "@/lib/credentials";
import { checkLimit } from "@/lib/listing-limits";
import { createSupabaseServerClient } from "@/lib/supabase/server";
import { PRICE_CAP_CENTS, PRICE_MAX_EUR } from "@/lib/utils";
import { isDiscountActive, parseDiscountFromFormData } from "@/lib/discount";

export type UpdateListingState = {
  error?: string;
  ok?: boolean;
};

export async function updateListing(
  offerId: string,
  _prev: UpdateListingState,
  formData: FormData,
): Promise<UpdateListingState> {
  const supabase = await createSupabaseServerClient();
  const {
    data: { user },
  } = await supabase.auth.getUser();
  if (!user) return { error: "You must be signed in." };

  // Fetch the row to confirm ownership + read the current discount state so
  // we know whether to accept new discount inputs or preserve the active one.
  // RLS would also block a wrong-user update, but asserting here gives us a
  // clear error message.
  const { data: existing, error: fetchError } = await supabase
    .from("accounts")
    .select("id, seller_id, status, game_id, discount_price, discount_ends_at")
    .eq("id", offerId)
    .maybeSingle();
  if (fetchError || !existing) return { error: "Listing not found." };
  if (existing.seller_id !== user.id) {
    return { error: "You can only edit listings you own." };
  }
  if (existing.status !== "AVAILABLE") {
    return { error: "This listing has been sold and can no longer be edited." };
  }

  const title = formData.get("title")?.toString().trim();
  const rawDescription = formData.get("description")?.toString().trim();
  const description =
    rawDescription && rawDescription.length > 0 ? rawDescription : null;
  const rawPlatform = formData.get("platform")?.toString().trim();
  const platform = rawPlatform && rawPlatform.length > 0 ? rawPlatform : null;
  const rawRegion = formData.get("region")?.toString().trim();
  const region = rawRegion && rawRegion.length > 0 ? rawRegion : null;
  const priceRaw = formData.get("price")?.toString();
  const oldPriceRaw = formData.get("oldPrice")?.toString();

  if (!title) return { error: "Title is required." };

  const creds = credentialsFromFormData(formData);
  const lengthError =
    checkLimit("title", title) ??
    checkLimit("description", description) ??
    checkLimit("platform", platform) ??
    checkLimit("region", region) ??
    checkLimit("credLogin", creds.login) ??
    checkLimit("credPassword", creds.password) ??
    checkLimit("credEmail", creds.email) ??
    checkLimit("credEmailPassword", creds.emailPassword) ??
    checkLimit("credNotes", creds.notes);
  if (lengthError) return { error: lengthError };

  const priceFloat = Number.parseFloat(priceRaw ?? "");
  if (!Number.isFinite(priceFloat) || priceFloat < 0) {
    return { error: "Selling price must be a positive number." };
  }
  const price = Math.round(priceFloat * 100);
  if (price > PRICE_CAP_CENTS) {
    return { error: `Selling price cannot exceed €${PRICE_MAX_EUR}.` };
  }

  let oldPrice: number | null = null;
  if (oldPriceRaw && oldPriceRaw.trim() !== "") {
    const oldFloat = Number.parseFloat(oldPriceRaw);
    if (!Number.isFinite(oldFloat) || oldFloat < 0) {
      return { error: "MRP must be a positive number." };
    }
    oldPrice = Math.round(oldFloat * 100);
    if (oldPrice < price) {
      return { error: "MRP must be greater than or equal to the selling price." };
    }
  }

  const images = formData
    .getAll("images")
    .map((value) => value.toString())
    .filter((url) => typeof url === "string" && url.startsWith("https://"))
    .slice(0, 10);

  // Discount cannot be stopped or paused — while one is active, skip the
  // form fields entirely and leave the existing `discount_*` columns alone.
  // Only once the existing discount has expired do we let the seller set a
  // new one (or leave both fields blank to run no discount at all).
  const updatePayload: Record<string, unknown> = {
    title,
    description,
    platform,
    region,
    price,
    old_price: oldPrice,
    images,
  };
  if (
    !isDiscountActive(existing.discount_price, existing.discount_ends_at)
  ) {
    const discountResult = parseDiscountFromFormData(formData, price);
    if ("error" in discountResult) return { error: discountResult.error };
    updatePayload.discount_price = discountResult.discount_price;
    updatePayload.discount_ends_at = discountResult.discount_ends_at;
  }

  const { error: updateError } = await supabase
    .from("accounts")
    .update(updatePayload)
    .eq("id", offerId);
  if (updateError) return { error: updateError.message };

  const credsResult = await saveCredentials(offerId, user.id, creds);
  if (credsResult.error) return { error: credsResult.error };

  revalidatePath(`/user/currently-selling/${offerId}`);
  revalidatePath("/");
  return { ok: true };
}
