"use server";

import { revalidatePath } from "next/cache";
import type { AccountCredentials } from "@/lib/credentials";
import { decrypt } from "@/lib/encryption";
import { createSupabaseServerClient } from "@/lib/supabase/server";

export type RevealCredentialsResult =
  | { ok: true; credentials: AccountCredentials; alreadyRevealed: boolean }
  | { error: string };

/**
 * Server-only — decrypts the credentials of an order belonging to the
 * caller. Calls the `reveal_credentials` RPC, which gates on
 * `buyer_id = auth.uid()` and bumps `orders.revealed_at` on first call,
 * then decrypts the ciphertext on the Node side using
 * CREDENTIALS_ENCRYPTION_KEY. Plaintext never reaches the browser as a
 * static prop — it's returned through this server action and rendered
 * inline.
 */
export async function revealOrderCredentials(
  orderId: string,
): Promise<RevealCredentialsResult> {
  const supabase = await createSupabaseServerClient();
  const {
    data: { user },
  } = await supabase.auth.getUser();
  if (!user) return { error: "Sign in to view credentials." };

  const { data, error } = await supabase.rpc("reveal_credentials", {
    p_order_number: orderId,
  });
  if (error) return { error: error.message };

  const row = Array.isArray(data) ? data[0] : data;
  if (!row?.encrypted_data) return { error: "No credentials available." };

  let plaintext: string;
  try {
    plaintext = decrypt(row.encrypted_data as string);
  } catch {
    return { error: "Could not decrypt credentials." };
  }

  let parsed: AccountCredentials;
  try {
    parsed = JSON.parse(plaintext) as AccountCredentials;
  } catch {
    return { error: "Credentials payload is malformed." };
  }

  // Refresh the order detail page so the next render sees revealed_at set
  // and switches the button to "View order details".
  revalidatePath(`/orders/${orderId}`);

  return {
    ok: true,
    credentials: parsed,
    alreadyRevealed: Boolean(row.was_already_revealed),
  };
}
