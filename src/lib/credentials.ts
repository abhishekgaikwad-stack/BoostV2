import { decrypt, encrypt } from "@/lib/encryption";
import { createSupabaseServerClient } from "@/lib/supabase/server";

/**
 * The decrypted credential payload for a listing. Stored as an encrypted
 * JSON blob in `public.credentials.encrypted_data`. Fields are all optional
 * so sellers can partially populate during listing and finish on the edit
 * page.
 */
export type AccountCredentials = {
  login?: string;
  password?: string;
  email?: string;
  emailPassword?: string;
  notes?: string;
};

export function hasAnyCredential(
  c: Partial<AccountCredentials> | null | undefined,
): c is AccountCredentials {
  if (!c) return false;
  return Boolean(
    c.login || c.password || c.email || c.emailPassword || c.notes,
  );
}

/**
 * Reads and decrypts credentials for a listing. Row is returned only when
 * RLS lets the current user see it (seller), so this is safe to call from
 * any authenticated server component — the DB enforces ownership, not us.
 */
export async function readCredentials(
  accountId: string,
): Promise<AccountCredentials | null> {
  const supabase = await createSupabaseServerClient();
  const { data, error } = await supabase
    .from("credentials")
    .select("encrypted_data")
    .eq("account_id", accountId)
    .maybeSingle();
  if (error || !data) return null;
  try {
    return JSON.parse(decrypt(data.encrypted_data)) as AccountCredentials;
  } catch (err) {
    console.warn("[credentials] decrypt failed:", err);
    return null;
  }
}

/**
 * Encrypts + upserts credentials for a listing. No-op if every field is
 * empty (so we don't persist meaningless rows).
 */
export async function saveCredentials(
  accountId: string,
  sellerId: string,
  credentials: Partial<AccountCredentials>,
): Promise<{ error?: string }> {
  if (!hasAnyCredential(credentials)) {
    // If the row previously existed and the seller cleared everything, also
    // delete the ciphertext so we don't keep a stale blob around.
    const supabase = await createSupabaseServerClient();
    await supabase.from("credentials").delete().eq("account_id", accountId);
    return {};
  }

  const supabase = await createSupabaseServerClient();
  const encryptedData = encrypt(JSON.stringify(credentials));
  const { error } = await supabase
    .from("credentials")
    .upsert(
      {
        account_id: accountId,
        seller_id: sellerId,
        encrypted_data: encryptedData,
      },
      { onConflict: "account_id" },
    );
  if (error) return { error: error.message };
  return {};
}

/**
 * Pulls the 5 credential fields out of a FormData, normalising empty
 * strings to undefined so `hasAnyCredential` works predictably.
 */
export function credentialsFromFormData(
  formData: FormData,
): Partial<AccountCredentials> {
  const take = (key: string) => {
    const raw = formData.get(key);
    if (typeof raw !== "string") return undefined;
    const trimmed = raw.trim();
    return trimmed === "" ? undefined : trimmed;
  };
  return {
    login: take("cred_login"),
    password: take("cred_password"),
    email: take("cred_email"),
    emailPassword: take("cred_email_password"),
    notes: take("cred_notes"),
  };
}
