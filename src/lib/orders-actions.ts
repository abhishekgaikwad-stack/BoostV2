"use server";

import { invalidateListingFeed } from "@/lib/cache";
import type { ProtectPlan } from "@/lib/protect";
import { getClientIp, placeOrderPerIpDaily } from "@/lib/rate-limit";
import { createSupabaseServerClient } from "@/lib/supabase/server";

export type PlaceOrderResult =
  | { ok: true; orderId: string; transactionId: string }
  | { error: string };

/**
 * Calls the `place_order` RPC, which atomically inserts the order and flips
 * the listing's status to SOLD. Validation (auth, listing availability,
 * payment-method allowlist, protect-plan allowlist, server-side fee
 * computation) happens inside the function — we surface its raise messages
 * back to the caller.
 */
export async function placeOrder(input: {
  offerId: string;
  paymentMethod: string;
  protectPlan?: ProtectPlan | null;
  /** Slug of the listing's game — used to bust the per-game offers cache.
   *  Optional so older callers keep working; passed in from CheckoutSummary
   *  which already has the full Account in scope. */
  gameSlug?: string;
}): Promise<PlaceOrderResult> {
  const supabase = await createSupabaseServerClient();
  const {
    data: { user },
  } = await supabase.auth.getUser();
  if (!user) return { error: "Sign in to complete your purchase." };

  // Per-IP daily ceiling — stops scripted checkout floods regardless of how
  // many accounts the attacker rotates through. A real shared-NAT user only
  // reaches this if dozens of people on their network are buying same-day.
  const ip = await getClientIp();
  const quota = await placeOrderPerIpDaily.limit(ip);
  if (!quota.success) {
    return {
      error: "Too many checkout attempts from your network today. Try again later.",
    };
  }

  const { data, error } = await supabase.rpc("place_order", {
    p_account_id: input.offerId,
    p_payment_method: input.paymentMethod,
    p_protect_plan: input.protectPlan ?? null,
  });

  if (error) return { error: error.message };

  const row = Array.isArray(data) ? data[0] : data;
  if (!row?.order_id || !row?.transaction_id) {
    return { error: "Could not place order." };
  }
  // The RPC flipped the listing's status to SOLD; bust the AVAILABLE-only
  // homepage rails AND the per-game offers cache so the just-sold listing
  // doesn't linger there for the remainder of the TTL.
  await invalidateListingFeed(input.gameSlug);
  return {
    ok: true,
    orderId: row.order_id as string,
    transactionId: row.transaction_id as string,
  };
}
