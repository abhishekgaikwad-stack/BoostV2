"use server";

import { createSupabaseServerClient } from "@/lib/supabase/server";

export type PlaceOrderResult =
  | { ok: true; orderId: string; transactionId: string }
  | { error: string };

/**
 * Calls the `place_order` RPC, which atomically inserts the order and flips
 * the listing's status to SOLD. Validation (auth, listing availability,
 * payment-method allowlist) happens inside the function — we surface its
 * raise messages back to the caller.
 */
export async function placeOrder(input: {
  offerId: string;
  paymentMethod: string;
}): Promise<PlaceOrderResult> {
  const supabase = await createSupabaseServerClient();
  const {
    data: { user },
  } = await supabase.auth.getUser();
  if (!user) return { error: "Sign in to complete your purchase." };

  const { data, error } = await supabase.rpc("place_order", {
    p_account_id: input.offerId,
    p_payment_method: input.paymentMethod,
  });

  if (error) return { error: error.message };

  const row = Array.isArray(data) ? data[0] : data;
  if (!row?.order_id || !row?.transaction_id) {
    return { error: "Could not place order." };
  }
  return {
    ok: true,
    orderId: row.order_id as string,
    transactionId: row.transaction_id as string,
  };
}
