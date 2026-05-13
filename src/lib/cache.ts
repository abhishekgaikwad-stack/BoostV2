import "server-only";
import { Redis } from "@upstash/redis";

// Lazy-init so importing this module doesn't crash a dev environment that
// hasn't set UPSTASH_REDIS_REST_*. When the client can't be built, or any
// individual op throws, helpers transparently bypass Redis and fall back to
// the loader — the cache is a perf layer, not a source of truth.
let resolved: Redis | null | undefined;

function client(): Redis | null {
  if (resolved !== undefined) return resolved;
  try {
    resolved = Redis.fromEnv();
  } catch {
    resolved = null;
  }
  return resolved;
}

/**
 * Get-or-set: returns the cached value for `key`, or calls `loader`, stores
 * the result with TTL `ttlSec`, and returns it. Nullish results are NOT
 * cached — caching `null` would mask newly-arrived rows for the rest of the
 * TTL window, which is a worse failure mode than re-running the loader.
 */
export async function cached<T>(
  key: string,
  ttlSec: number,
  loader: () => Promise<T>,
): Promise<T> {
  const c = client();
  if (!c) return loader();
  try {
    const hit = await c.get<T>(key);
    if (hit !== null && hit !== undefined) return hit;
  } catch {
    return loader();
  }
  const fresh = await loader();
  if (fresh != null) {
    try {
      await c.set(key, fresh, { ex: ttlSec });
    } catch {
      // Next request re-runs the loader — acceptable.
    }
  }
  return fresh;
}

export async function invalidate(...keys: string[]): Promise<void> {
  if (keys.length === 0) return;
  const c = client();
  if (!c) return;
  try {
    await c.del(...keys);
  } catch {
    // Stale-cache risk on failure is bounded by the TTL.
  }
}

// ---------- Listing-feed cache keys ----------
//
// These back the public homepage / game-listing rails (`recentOffers`,
// `firstFlashOffer`, `listGames`, `offersForGame`). Any code path that
// mutates a row in `accounts` in a way that affects the AVAILABLE feed
// should call `invalidateListingFeed(slug?)` so the next render reflects
// the change without waiting on the TTL.
export const listingFeedKeys = {
  recentOffers: (limit: number) => `feed:recent:${limit}`,
  firstFlashOffer: () => "feed:flash:first",
  listGames: (limit: number) => `feed:games:${limit}`,
  offersForGame: (slug: string, limit: number) =>
    `feed:game-offers:${slug}:${limit}`,
};

// Limits currently passed to `recentOffers` from caller code. If a new
// caller adds a different limit and the result needs to track listing
// mutations, add that limit here.
const RECENT_OFFERS_LIMITS = [10] as const;

// Limits currently passed to `offersForGame`: 100 from the game-listing
// page, 6 from similarOffers (PDP related-products rail). Same rule as
// above — add to this list if a new caller uses a new limit.
const OFFERS_FOR_GAME_LIMITS = [6, 100] as const;

/**
 * Bust the public listing-feed caches. Always busts the global rails
 * (`recentOffers`, `firstFlashOffer`). When `slug` is provided, also
 * busts the per-game offer-list cache for that slug — call sites pass
 * the slug of the affected listing when known so game-detail pages
 * reflect the change immediately rather than waiting on the 5-min TTL.
 */
export async function invalidateListingFeed(slug?: string): Promise<void> {
  const keys: string[] = [
    ...RECENT_OFFERS_LIMITS.map((n) => listingFeedKeys.recentOffers(n)),
    listingFeedKeys.firstFlashOffer(),
  ];
  if (slug) {
    for (const limit of OFFERS_FOR_GAME_LIMITS) {
      keys.push(listingFeedKeys.offersForGame(slug, limit));
    }
  }
  await invalidate(...keys);
}

// ---------- Seller-review-stats cache ----------
//
// `getSellerReviewStats` loads every rating row for a seller and
// aggregates in JS (see comment in `src/lib/reviews.ts`). Cheap to
// cache — invalidate on every new / edited review for that seller.
export const sellerReviewStatsKey = (sellerId: string) =>
  `reviews:seller:${sellerId}:stats`;

export async function invalidateSellerReviewStats(
  sellerId: string,
): Promise<void> {
  await invalidate(sellerReviewStatsKey(sellerId));
}
