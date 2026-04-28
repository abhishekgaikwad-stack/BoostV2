"use server";

import { revalidatePath } from "next/cache";
import type { ReceivedChecks } from "@/lib/orders";
import { createSupabaseServerClient } from "@/lib/supabase/server";

export type ConfirmReceivedResult =
  | { ok: true }
  | { error: string };

/**
 * Records the buyer's "Mark as received" confirmation. Calls the
 * mark_order_received RPC, which is gated on `buyer_id = auth.uid()` and
 * locks the row once `marked_received_at` is set so the user can't flip
 * the confirmation back and forth. The 4 (or 3, when no email creds were
 * shipped) checkbox booleans are persisted verbatim in `received_checks`
 * for audit / dispute trails.
 */
export async function confirmOrderReceived(input: {
  orderId: string;
  checks: ReceivedChecks;
}): Promise<ConfirmReceivedResult> {
  const supabase = await createSupabaseServerClient();
  const {
    data: { user },
  } = await supabase.auth.getUser();
  if (!user) return { error: "Sign in to confirm receipt." };

  const { error } = await supabase.rpc("mark_order_received", {
    p_order_number: input.orderId,
    p_checks: input.checks,
  });

  if (error) return { error: error.message };

  revalidatePath(`/orders/${input.orderId}`);
  revalidatePath("/user/orders");
  return { ok: true };
}
