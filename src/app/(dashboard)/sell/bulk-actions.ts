"use server";

import { revalidatePath } from "next/cache";
import type { AccountCredentials } from "@/lib/credentials";
import { BULK_MAX_ROWS, type BulkListingRow } from "@/lib/csv";
import { encrypt } from "@/lib/encryption";
import { createSupabaseServerClient } from "@/lib/supabase/server";

export type BulkResult =
  | { ok: true; createdIds: string[] }
  | { ok: false; error: string };

/**
 * Atomic bulk insert — all rows persist or none do, via the
 * `create_listings_bulk` Postgres function. Credentials are encrypted on
 * the server before being handed to the RPC, so the DB never sees plaintext
 * and the encryption key never leaves Node.
 */
export async function createBulkListings(
  gameId: string,
  gameSlug: string,
  rows: BulkListingRow[],
): Promise<BulkResult> {
  const supabase = await createSupabaseServerClient();
  const {
    data: { user },
  } = await supabase.auth.getUser();
  if (!user) return { ok: false, error: "You must be signed in." };

  const { data: profile } = await supabase
    .from("profiles")
    .select("is_seller")
    .eq("id", user.id)
    .maybeSingle();
  if (!profile?.is_seller) {
    return { ok: false, error: "Turn on seller mode first." };
  }

  if (!Array.isArray(rows) || rows.length === 0) {
    return { ok: false, error: "No listings to create." };
  }
  if (rows.length > BULK_MAX_ROWS) {
    return {
      ok: false,
      error: `Max ${BULK_MAX_ROWS} listings per upload.`,
    };
  }

  // Re-validate game (client is not authoritative) so the slug/id pair
  // actually exists in `public.games`.
  const { data: game } = await supabase
    .from("games")
    .select("id, slug")
    .eq("id", gameId)
    .maybeSingle();
  if (!game || game.slug !== gameSlug) {
    return { ok: false, error: "Unknown game." };
  }

  // Server-side re-validation — defence in depth against any bypass of the
  // client parser. Fail fast with a row-precise error.
  for (let i = 0; i < rows.length; i += 1) {
    const r = rows[i];
    if (!r.title || r.title.trim() === "") {
      return { ok: false, error: `Row ${i + 2}: title is required.` };
    }
    if (!Number.isFinite(r.priceEur) || r.priceEur < 0) {
      return { ok: false, error: `Row ${i + 2}: price must be positive.` };
    }
    if (r.oldPriceEur != null) {
      if (!Number.isFinite(r.oldPriceEur) || r.oldPriceEur < 0) {
        return { ok: false, error: `Row ${i + 2}: old price invalid.` };
      }
      if (r.oldPriceEur < r.priceEur) {
        return {
          ok: false,
          error: `Row ${i + 2}: old price must be >= price.`,
        };
      }
    }
  }

  // Build payload — encrypt each row's credentials up front, then hand off
  // an array of ciphertext blobs to the RPC.
  const payload = rows.map((r) => {
    const creds: Partial<AccountCredentials> = {
      login: r.credLogin,
      password: r.credPassword,
      email: r.credEmail,
      emailPassword: r.credEmailPassword,
      notes: r.credNotes,
    };
    const hasAny = Object.values(creds).some(
      (v) => typeof v === "string" && v.trim().length > 0,
    );
    const encrypted = hasAny ? encrypt(JSON.stringify(creds)) : null;

    return {
      title: r.title.trim(),
      description: r.description?.trim() ?? "",
      region: r.region?.trim() ?? "",
      level: r.level?.trim() ?? "",
      rank: r.rank?.trim() ?? "",
      price: Math.round(r.priceEur * 100),
      old_price:
        r.oldPriceEur != null ? Math.round(r.oldPriceEur * 100) : null,
      encrypted_credentials: encrypted,
    };
  });

  const { data, error } = await supabase.rpc("create_listings_bulk", {
    p_game_id: gameId,
    p_listings: payload,
  });

  if (error) return { ok: false, error: error.message };

  revalidatePath("/user/currently-selling");
  revalidatePath("/");
  revalidatePath(`/games/${gameSlug}`);

  return { ok: true, createdIds: (data as string[] | null) ?? [] };
}
