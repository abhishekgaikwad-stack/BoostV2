"use server";

import {
  getClientIp,
  loginOtpPerEmailPerHour,
  loginOtpPerIpPerHour,
} from "@/lib/rate-limit";
import { createSupabaseServerClient } from "@/lib/supabase/server";

export type RequestLoginOtpResult = { ok: true } | { error: string };

// Inexpensive sanity check — Supabase will reject malformed addresses
// regardless, but we want to skip the rate-limit increment + the upstream
// roundtrip when the input is obviously bad.
const EMAIL_RE = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;

/**
 * Server-action wrapper around `supabase.auth.signInWithOtp`. The previous
 * implementation called this directly from the browser, which left the
 * magic-link request unrate-limitable from our side — Supabase's per-project
 * 30/h auth-email cap would eventually fire, but an attacker could still
 * flood a victim's inbox (or burn through that shared quota) before we ever
 * saw the traffic.
 *
 * Now: rate-limited at two layers in parallel — per source IP (catches an
 * attacker fanning across many emails) and per email address (catches an
 * attacker fanning across rotating IPs to spam one inbox). Either limit
 * tripping returns a clean error to the caller without invoking Supabase.
 *
 * `redirectTo` is supplied by the client because the server doesn't know
 * the browser's current path; Supabase still enforces its "Site URL +
 * additional redirect URLs" allow-list, so an attacker can't smuggle an
 * arbitrary callback through this parameter.
 */
export async function requestLoginOtp(input: {
  email: string;
  redirectTo: string;
}): Promise<RequestLoginOtpResult> {
  const email = input.email.trim().toLowerCase();
  if (!email || !EMAIL_RE.test(email)) {
    return { error: "Please enter a valid email address." };
  }
  if (
    !input.redirectTo ||
    !/^https?:\/\//i.test(input.redirectTo)
  ) {
    return { error: "Invalid redirect URL." };
  }

  const ip = await getClientIp();
  const [ipQuota, emailQuota] = await Promise.all([
    loginOtpPerIpPerHour.limit(ip),
    loginOtpPerEmailPerHour.limit(email),
  ]);

  // Surface the email-cap error first when both fail — it's the user-facing
  // hint that's actionable. The IP-cap message would just confuse a
  // legitimate user on a shared NAT and tells an attacker that fanning out
  // emails won't help.
  if (!emailQuota.success) {
    return {
      error: "Too many sign-in requests for this email. Try again in an hour.",
    };
  }
  if (!ipQuota.success) {
    return {
      error: "Too many sign-in requests from your network. Try again later.",
    };
  }

  const supabase = await createSupabaseServerClient();
  const { error } = await supabase.auth.signInWithOtp({
    email,
    options: { emailRedirectTo: input.redirectTo },
  });
  if (error) {
    // Supabase already prevents email-enumeration by sending a magic link
    // even for unknown addresses — so we can pass its error through without
    // leaking whether the account exists.
    return { error: error.message };
  }

  return { ok: true };
}
