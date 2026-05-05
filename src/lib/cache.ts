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
// `firstFlashOffer`, `listGames`). Any code path that mutates a row in
// `accounts` in a way that affects the AVAILABLE feed should call
// `invalidateListingFeed()` so the next homepage hit reflects the change
// without waiting on the TTL.
export const listingFeedKeys = {
  recentOffers: (limit: number) => `feed:recent:${limit}`,
  firstFlashOffer: () => "feed:flash:first",
  listGames: (limit: number) => `feed:games:${limit}`,
};

// Limits currently passed to `recentOffers` from caller code. If a new
// caller adds a different limit and the result needs to track listing
// mutations, add that limit here.
const RECENT_OFFERS_LIMITS = [10] as const;

export async function invalidateListingFeed(): Promise<void> {
  await invalidate(
    ...RECENT_OFFERS_LIMITS.map((n) => listingFeedKeys.recentOffers(n)),
    listingFeedKeys.firstFlashOffer(),
  );
}
