import { clsx, type ClassValue } from "clsx"
import { twMerge } from "tailwind-merge"

export function cn(...inputs: ClassValue[]) {
  return twMerge(clsx(inputs))
}

export function discountPercent(price: number, oldPrice?: number): number | null {
  if (!oldPrice || oldPrice <= price) return null;
  return Math.round((1 - price / oldPrice) * 100);
}

/**
 * Format an ISO timestamp into a countdown label like
 * `OFFER ENDS IN 42HRS 32MIN`. Returns null when the input is missing or
 * malformed, and `OFFER ENDED` once the timestamp is in the past.
 */
export function formatOfferEnds(endsAt: string | null | undefined): string | null {
  if (!endsAt) return null;
  const end = new Date(endsAt).getTime();
  if (!Number.isFinite(end)) return null;
  const diff = end - Date.now();
  if (diff <= 0) return "OFFER ENDED";
  const hours = Math.floor(diff / (1000 * 60 * 60));
  const minutes = Math.floor((diff % (1000 * 60 * 60)) / (1000 * 60));
  return `OFFER ENDS IN ${hours}HRS ${minutes}MIN`;
}
