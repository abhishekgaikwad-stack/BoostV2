import "server-only";
import { Ratelimit } from "@upstash/ratelimit";
import { Redis } from "@upstash/redis";
import { headers } from "next/headers";

// Reads UPSTASH_REDIS_REST_URL and UPSTASH_REDIS_REST_TOKEN from env.
// Throws on use if either is missing — fail-loud is the right default,
// otherwise rate-limited endpoints would silently let everything through.
const redis = Redis.fromEnv();

/**
 * Best-effort client IP for rate-limiting unauthenticated or IP-scoped
 * paths. Vercel sets `x-forwarded-for`; the leftmost entry is the original
 * client. Falls back to `x-real-ip`, then a sentinel that buckets every
 * unknown caller together — that bucket fills up fast under attack, which
 * is the desired behaviour. Never throws.
 */
export async function getClientIp(): Promise<string> {
  const h = await headers();
  const xff = h.get("x-forwarded-for");
  if (xff) {
    const first = xff.split(",")[0]?.trim();
    if (first) return first;
  }
  return h.get("x-real-ip") ?? "ip:unknown";
}

/**
 * 100 calls per signed-in user per day for the Claude-Haiku
 * platform/region auto-detect. Sliding window so a user that hit the
 * cap at 11pm doesn't get a fresh 100 at midnight — they get 100 over
 * any rolling 24-hour stretch.
 */
export const aiDetectPerUserDaily = new Ratelimit({
  redis,
  limiter: Ratelimit.slidingWindow(100, "1 d"),
  analytics: true,
  prefix: "rl:ai-detect:user",
});

/**
 * 200 calls per source IP per day on top of the per-user cap. Catches
 * multi-account amplification (one attacker rotating through fresh
 * accounts to clear the per-user limit each time). Set to 2x the
 * per-user cap so a small office sharing one NAT'd IP isn't cut off by
 * normal usage. Only applied at the single-listing form route — bulk
 * uploads already have their own per-user-per-hour ceiling and a
 * per-row IP cap here would break legitimate 500-row uploads.
 */
export const aiDetectPerIpDaily = new Ratelimit({
  redis,
  limiter: Ratelimit.slidingWindow(200, "1 d"),
  analytics: true,
  prefix: "rl:ai-detect:ip",
});

/**
 * 100 order placements per IP per rolling 24h. Catches scripted abuse
 * (mass checkout attempts, price probing) without blocking legitimate
 * shoppers — typical buyers place a handful of orders/day at most.
 * Note: shared NAT (corporate, university, mobile carrier) puts many
 * users behind one IP; this cap is high enough not to bite them in
 * practice but tune down if abuse appears.
 */
export const placeOrderPerIpDaily = new Ratelimit({
  redis,
  limiter: Ratelimit.slidingWindow(100, "1 d"),
  analytics: true,
  prefix: "rl:place-order:ip",
});

/**
 * 10 single-listing creations per seller per minute. Stops scripts
 * flooding the marketplace; well above any real seller's manual rate.
 */
export const createListingPerUserPerMinute = new Ratelimit({
  redis,
  limiter: Ratelimit.slidingWindow(10, "1 m"),
  analytics: true,
  prefix: "rl:create-listing:user",
});

/**
 * 5 bulk CSV uploads per seller per hour. Each upload can carry up to
 * BULK_MAX_ROWS rows + an AI fan-out, so the sustained cost of repeated
 * uploads is high. 5/h leaves comfortable room for legitimate retries.
 */
export const createBulkListingsPerUserPerHour = new Ratelimit({
  redis,
  limiter: Ratelimit.slidingWindow(5, "1 h"),
  analytics: true,
  prefix: "rl:create-bulk:user",
});

/**
 * 10 review submissions / edits per buyer per minute. Spam on new
 * reviews is naturally bounded by `offer_reviews_unique_buyer` (one
 * review per buyer per listing), but the 30-day edit window has no DB
 * cap on edit frequency — this catches scripted edit floods.
 */
export const submitReviewPerUserPerMinute = new Ratelimit({
  redis,
  limiter: Ratelimit.slidingWindow(10, "1 m"),
  analytics: true,
  prefix: "rl:submit-review:user",
});

/**
 * 30 listing-image presigns per seller per minute. Above any realistic
 * manual upload rate (10 images max per listing); blocks scripted
 * presign storms that would burn AWS API quota.
 */
export const listingImagePresignPerUserPerMinute = new Ratelimit({
  redis,
  limiter: Ratelimit.slidingWindow(30, "1 m"),
  analytics: true,
  prefix: "rl:upload-listing-img:user",
});

/**
 * 5 avatar presigns per user per minute. Avatar is a single image,
 * so even a flurry of retries shouldn't exceed this. Stops scripted
 * abuse on a non-seller-gated endpoint.
 */
export const avatarPresignPerUserPerMinute = new Ratelimit({
  redis,
  limiter: Ratelimit.slidingWindow(5, "1 m"),
  analytics: true,
  prefix: "rl:upload-avatar:user",
});
