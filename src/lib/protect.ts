/**
 * Boost Protect — extended-warranty add-on attached to an order.
 *
 * Server-side authority lives in the `place_order` RPC (migration 0015).
 * The values here are mirrored client-side for display and for selection
 * UI on the PDP popup. The rounding rule below is the only correct way
 * to compute the cent amount: `Math.round(priceCents * rate)`. Postgres
 * uses the same rule, so client and server agree to the cent.
 */

export type ProtectPlan = "3m" | "6m";

export const PROTECT_RATES: Record<ProtectPlan, number> = {
  "3m": 0.10,
  "6m": 0.14,
};

export const PROTECT_PLAN_LABELS: Record<ProtectPlan, string> = {
  "3m": "3 Months",
  "6m": "6 Months",
};

const MONTHS_BY_PLAN: Record<ProtectPlan, number> = {
  "3m": 3,
  "6m": 6,
};

/**
 * Cent-precise fee for `plan` against `priceCents`. Returns 0 for null
 * (no protect) so callers can sum unconditionally.
 */
export function protectFeeCents(
  priceCents: number,
  plan: ProtectPlan | null | undefined,
): number {
  if (!plan) return 0;
  return Math.round(priceCents * PROTECT_RATES[plan]);
}

/**
 * Display-friendly euro fee for the modal / checkout summary. Wraps the
 * cent helper and converts back to euros — never compute the fee from
 * the displayed euro value, always go through cents to avoid drift.
 */
export function protectFeeEuro(
  priceEuro: number,
  plan: ProtectPlan | null | undefined,
): number {
  return protectFeeCents(Math.round(priceEuro * 100), plan) / 100;
}

/**
 * The warranty end date — `created_at + N months` where N is determined
 * by the plan. Returns null when there is no plan. Server stores only
 * `protect_plan`; this is the single source of truth for deriving the
 * end date in the UI.
 */
export function warrantyEndsAt(
  createdAtIso: string,
  plan: ProtectPlan | null | undefined,
): string | null {
  if (!plan) return null;
  const start = new Date(createdAtIso);
  if (Number.isNaN(start.getTime())) return null;
  const end = new Date(start);
  end.setMonth(end.getMonth() + MONTHS_BY_PLAN[plan]);
  return end.toISOString();
}

/**
 * Strict parser for query-string / form values. Anything other than the
 * two known plans collapses to null, so an attacker can't smuggle an
 * arbitrary string into the popup or the RPC call.
 */
export function parseProtectPlan(input: unknown): ProtectPlan | null {
  if (input === "3m" || input === "6m") return input;
  return null;
}
