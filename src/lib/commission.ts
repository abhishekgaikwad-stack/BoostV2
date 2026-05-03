// Seller commission rate. Display-only for now — the actual split happens
// when Stripe Connect lands (Sprint 2 of the soft-launch plan); until then
// place_order doesn't deduct anything. Single source of truth so when we
// wire Stripe, both the form preview and the payout calculation read the
// same number.

export const SELLER_COMMISSION_RATE = 0.05; // 5%

/** Cent-precise commission for a price in cents. */
export function commissionCents(priceCents: number): number {
  return Math.round(priceCents * SELLER_COMMISSION_RATE);
}

/** Cent-precise seller payout (price minus commission) for a price in cents. */
export function payoutCents(priceCents: number): number {
  return priceCents - commissionCents(priceCents);
}
