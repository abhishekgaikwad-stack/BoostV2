"use server";

import { revalidatePath } from "next/cache";
import { detectListingAttrs } from "@/lib/ai-detect";
import type { AccountCredentials } from "@/lib/credentials";
import { BULK_MAX_ROWS, type BulkListingRow } from "@/lib/csv";
import { encrypt } from "@/lib/encryption";
import { LISTING_LIMITS } from "@/lib/listing-limits";
import { createSupabaseServerClient } from "@/lib/supabase/server";
import { PRICE_MAX_EUR } from "@/lib/utils";

// Concurrency cap for the AI fan-out — at 500-row max bulk uploads, fully
// auto-detected runs would otherwise hammer Anthropic. 5 is conservative;
// per-call latency ~500-1500ms.
const DETECT_CONCURRENCY = 5;

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
    if (r.priceEur > PRICE_MAX_EUR) {
      return {
        ok: false,
        error: `Row ${i + 2}: price cannot exceed €${PRICE_MAX_EUR}.`,
      };
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
    const lengthChecks: Array<[string, string | undefined, number]> = [
      ["title", r.title, LISTING_LIMITS.title],
      ["description", r.description, LISTING_LIMITS.description],
      ["platform", r.platform, LISTING_LIMITS.platform],
      ["region", r.region, LISTING_LIMITS.region],
      ["cred_login", r.credLogin, LISTING_LIMITS.credLogin],
      ["cred_password", r.credPassword, LISTING_LIMITS.credPassword],
      ["cred_email", r.credEmail, LISTING_LIMITS.credEmail],
      [
        "cred_email_password",
        r.credEmailPassword,
        LISTING_LIMITS.credEmailPassword,
      ],
      ["cred_notes", r.credNotes, LISTING_LIMITS.credNotes],
    ];
    for (const [name, value, max] of lengthChecks) {
      if (value && value.length > max) {
        return {
          ok: false,
          error: `Row ${i + 2}: ${name} cannot exceed ${max} characters.`,
        };
      }
    }
  }

  // For rows that left platform OR region blank, run Claude Haiku to extract
  // them from title + description. Concurrent fan-out (capped) keeps total
  // upload latency reasonable on big CSVs. Detection failures don't fail the
  // bulk — they just leave the column null.
  const detected: Array<{ platform?: string; region?: string }> = await runWithLimit(
    rows.map((r) => async () => {
      const havePlatform = r.platform && r.platform.trim().length > 0;
      const haveRegion = r.region && r.region.trim().length > 0;
      if (havePlatform && haveRegion) {
        return { platform: r.platform, region: r.region };
      }
      const result = await detectListingAttrs({
        title: r.title,
        description: r.description ?? "",
      });
      if (!result.ok) {
        return { platform: r.platform, region: r.region };
      }
      return {
        platform: havePlatform ? r.platform : result.attrs.platform ?? undefined,
        region: haveRegion ? r.region : result.attrs.region ?? undefined,
      };
    }),
    DETECT_CONCURRENCY,
  );

  // Build payload — encrypt each row's credentials up front, then hand off
  // an array of ciphertext blobs to the RPC.
  const payload = rows.map((r, i) => {
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
      platform: detected[i].platform?.trim() ?? "",
      region: detected[i].region?.trim() ?? "",
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

/**
 * Runs an array of async tasks with a fixed concurrency cap, preserving the
 * input order in the output. Used for the bulk AI detection fan-out.
 */
async function runWithLimit<T>(
  tasks: Array<() => Promise<T>>,
  limit: number,
): Promise<T[]> {
  const results: T[] = new Array(tasks.length);
  let cursor = 0;

  async function worker() {
    while (cursor < tasks.length) {
      const idx = cursor++;
      results[idx] = await tasks[idx]();
    }
  }

  await Promise.all(
    Array.from({ length: Math.min(limit, tasks.length) }, () => worker()),
  );
  return results;
}
