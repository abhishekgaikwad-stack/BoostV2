"use server";

import { revalidatePath } from "next/cache";
import { redirect } from "next/navigation";
import {
  credentialsFromFormData,
  saveCredentials,
} from "@/lib/credentials";
import { checkLimit } from "@/lib/listing-limits";
import { createSupabaseServerClient } from "@/lib/supabase/server";
import { PRICE_CAP_CENTS, PRICE_MAX_EUR } from "@/lib/utils";
import { parseDiscountFromFormData } from "@/lib/discount";

export type CreateListingState = {
  error?: string;
};

export async function createListing(
  _prev: CreateListingState,
  formData: FormData,
): Promise<CreateListingState> {
  const supabase = await createSupabaseServerClient();
  const {
    data: { user },
  } = await supabase.auth.getUser();
  if (!user) return { error: "You must be signed in to create a listing." };

  const { data: profile } = await supabase
    .from("profiles")
    .select("is_seller")
    .eq("id", user.id)
    .maybeSingle();
  if (!profile?.is_seller) {
    return { error: "Turn on seller mode from your profile first." };
  }

  const gameId = formData.get("gameId")?.toString();
  const title = formData.get("title")?.toString().trim();
  const rawDescription = formData.get("description")?.toString().trim();
  const description = rawDescription && rawDescription.length > 0 ? rawDescription : null;
  const priceRaw = formData.get("price")?.toString();
  const oldPriceRaw = formData.get("oldPrice")?.toString();
  const rawPlatform = formData.get("platform")?.toString().trim();
  const platform = rawPlatform && rawPlatform.length > 0 ? rawPlatform : null;
  const rawRegion = formData.get("region")?.toString().trim();
  const region = rawRegion && rawRegion.length > 0 ? rawRegion : null;
  // formData.getAll returns every <input name="images"> we rendered — these
  // were already uploaded client-side via presigned PUTs, so we just persist
  // the URLs. Cap at 10 as a belt-and-braces check against tampering.
  const images = formData
    .getAll("images")
    .map((value) => value.toString())
    .filter((url) => typeof url === "string" && url.startsWith("https://"))
    .slice(0, 10);

  if (!gameId) return { error: "Please select a game." };
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
  const price = Math.round(priceFloat * 100); // cents, also enforces 2dp
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

  const discountResult = parseDiscountFromFormData(formData, price);
  if ("error" in discountResult) return { error: discountResult.error };

  const { data, error } = await supabase
    .from("accounts")
    .insert({
      game_id: gameId,
      seller_id: user.id,
      title,
      description,
      platform,
      region,
      price,
      old_price: oldPrice,
      discount_price: discountResult.discount_price,
      discount_ends_at: discountResult.discount_ends_at,
      images,
      status: "AVAILABLE",
    })
    .select("id, game:games(slug)")
    .single();

  if (error) return { error: error.message };

  // Encrypt-and-save credentials in the same request so the seller doesn't
  // have to hop to an edit page to finish setting up. No-op when empty.
  // Lengths were validated above before the listing was inserted.
  const credentialsResult = await saveCredentials(data.id, user.id, creds);
  if (credentialsResult.error) {
    // Listing already created; surface the credential error so the seller
    // knows to retry from the edit page.
    return {
      error: `Listing saved, but credentials failed: ${credentialsResult.error}`,
    };
  }

  const gameSlug = (data.game as unknown as { slug: string }).slug;
  revalidatePath("/");
  revalidatePath(`/games/${gameSlug}`);
  redirect(`/games/${gameSlug}/${data.id}`);
}
