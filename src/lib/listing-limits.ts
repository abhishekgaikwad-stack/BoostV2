// Character limits for listing-form fields. Same numbers serve as the
// breach-detection threshold on the client (the counter only appears once
// length > max) and as the server-side validation cutoff (we reject before
// hitting the DB / encryption).

export const LISTING_LIMITS = {
  title: 200,
  description: 1000,
  platform: 50,
  region: 100,
  credLogin: 100,
  credPassword: 100,
  credEmail: 100,
  credEmailPassword: 100,
  credNotes: 500,
} as const;

export type ListingLimitKey = keyof typeof LISTING_LIMITS;

const LISTING_LIMIT_LABELS: Record<ListingLimitKey, string> = {
  title: "Title",
  description: "Description",
  platform: "Platform",
  region: "Region",
  credLogin: "Login",
  credPassword: "Password",
  credEmail: "Email",
  credEmailPassword: "Email password",
  credNotes: "Notes",
};

/** Returns an error message string when `value` exceeds the limit, else null. */
export function checkLimit(
  key: ListingLimitKey,
  value: string | null | undefined,
): string | null {
  if (!value) return null;
  const max = LISTING_LIMITS[key];
  if (value.length <= max) return null;
  return `${LISTING_LIMIT_LABELS[key]} cannot exceed ${max} characters.`;
}
