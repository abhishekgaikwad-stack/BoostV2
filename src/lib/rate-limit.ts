import "server-only";
import { Ratelimit } from "@upstash/ratelimit";
import { Redis } from "@upstash/redis";

// Reads UPSTASH_REDIS_REST_URL and UPSTASH_REDIS_REST_TOKEN from env.
// Throws on use if either is missing — fail-loud is the right default,
// otherwise rate-limited endpoints would silently let everything through.
const redis = Redis.fromEnv();

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
