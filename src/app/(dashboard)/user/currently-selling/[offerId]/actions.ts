"use server";

import { revalidatePath } from "next/cache";
import {
  credentialsFromFormData,
  saveCredentials,
} from "@/lib/credentials";
import { createSupabaseServerClient } from "@/lib/supabase/server";
import { PRICE_CAP_CENTS, PRICE_MAX_EUR } from "@/lib/utils";

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

  // Fetch the row to confirm ownership. RLS would also block a wrong-user
  // update, but asserting here gives us a clear error message.
  const { data: existing, error: fetchError } = await supabase
    .from("accounts")
    .select("id, seller_id, game_id")
    .eq("id", offerId)
    .maybeSingle();
  if (fetchError || !existing) return { error: "Listing not found." };
  if (existing.seller_id !== user.id) {
    return { error: "You can only edit listings you own." };
  }

  const title = formData.get("title")?.toString().trim();
  const rawDescription = formData.get("description")?.toString().trim();
  const description =
    rawDescription && rawDescription.length > 0 ? rawDescription : null;
  const priceRaw = formData.get("price")?.toString();
  const oldPriceRaw = formData.get("oldPrice")?.toString();

  if (!title) return { error: "Title is required." };

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
    if (oldPrice > PRICE_CAP_CENTS) {
      return { error: `MRP cannot exceed €${PRICE_MAX_EUR}.` };
    }
    if (oldPrice < price) {
      return { error: "MRP must be greater than or equal to the selling price." };
    }
  }

  const images = formData
    .getAll("images")
    .map((value) => value.toString())
    .filter((url) => typeof url === "string" && url.startsWith("https://"))
    .slice(0, 10);

  const { error: updateError } = await supabase
    .from("accounts")
    .update({
      title,
      description,
      price,
      old_price: oldPrice,
      images,
    })
    .eq("id", offerId);
  if (updateError) return { error: updateError.message };

  const credsResult = await saveCredentials(
    offerId,
    user.id,
    credentialsFromFormData(formData),
  );
  if (credsResult.error) return { error: credsResult.error };

  revalidatePath(`/user/currently-selling/${offerId}`);
  revalidatePath("/");
  return { ok: true };
}
