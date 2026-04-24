/**
 * Shared helpers for the seller-run flash discount feature.
 *
 * The on-the-wire shape is two form fields: `discountPrice` (euros, floating)
 * and `discountHours` (floating, whole hours or fractions). Both must be
 * supplied together or both must be empty; the server actions route through
 * `parseDiscountFromFormData` to validate and convert to the DB representation.
 */

export const DISCOUNT_MAX_HOURS = 72;

export type ParsedDiscount = {
  discount_price: number | null;
  discount_ends_at: string | null;
};

export type DiscountParseError = { error: string };

/**
 * Read `discountPrice` + `discountHours` off a FormData, validate, and return
 * the DB-shaped pair. `sellingPriceCents` is passed in so we can enforce the
 * "discount must be strictly less than selling price" rule.
 */
export function parseDiscountFromFormData(
  formData: FormData,
  sellingPriceCents: number,
): ParsedDiscount | DiscountParseError {
  const priceRaw = formData.get("discountPrice")?.toString().trim() ?? "";
  const hoursRaw = formData.get("discountHours")?.toString().trim() ?? "";

  if (priceRaw === "" && hoursRaw === "") {
    return { discount_price: null, discount_ends_at: null };
  }
  if (priceRaw === "" || hoursRaw === "") {
    return {
      error: "Discount needs both a price and a duration — or leave both blank.",
    };
  }

  const priceFloat = Number.parseFloat(priceRaw);
  if (!Number.isFinite(priceFloat) || priceFloat < 0) {
    return { error: "Discount price must be a non-negative number." };
  }
  const priceCents = Math.round(priceFloat * 100);
  if (priceCents >= sellingPriceCents) {
    return { error: "Discount price must be less than the selling price." };
  }

  const hoursFloat = Number.parseFloat(hoursRaw);
  if (!Number.isFinite(hoursFloat) || hoursFloat <= 0) {
    return { error: "Discount duration must be greater than zero." };
  }
  if (hoursFloat > DISCOUNT_MAX_HOURS) {
    return {
      error: `Discount duration cannot exceed ${DISCOUNT_MAX_HOURS} hours.`,
    };
  }

  const endsAt = new Date(Date.now() + hoursFloat * 3_600_000).toISOString();
  return { discount_price: priceCents, discount_ends_at: endsAt };
}

/** True iff the given discount fields describe an active (unexpired) discount. */
export function isDiscountActive(
  discountPriceCents: number | null | undefined,
  discountEndsAt: string | null | undefined,
): boolean {
  if (discountPriceCents == null || !discountEndsAt) return false;
  const end = new Date(discountEndsAt).getTime();
  if (!Number.isFinite(end)) return false;
  return end > Date.now();
}
