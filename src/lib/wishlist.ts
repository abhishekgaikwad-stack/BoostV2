import { createSupabaseServerClient } from "@/lib/supabase/server";
import {
  ACCOUNT_SELECT,
  type AccountRow,
  decodeCursor,
  encodeCursor,
  type ListingPage,
  type ListingQuery,
  toAccount,
} from "@/lib/offers";

/**
 * Account ids the signed-in user has wishlisted. Anonymous users get an
 * empty array. Used to seed the client-side WishlistProvider so every
 * ProductCard heart renders the correct state on first paint.
 */
export async function getMyWishlistIds(): Promise<string[]> {
  const supabase = await createSupabaseServerClient();
  const {
    data: { user },
  } = await supabase.auth.getUser();
  if (!user) return [];

  const { data, error } = await supabase
    .from("wishlists")
    .select("account_id")
    .eq("user_id", user.id);
  if (error || !data) return [];
  return data.map((row) => row.account_id as string);
}

type WishlistRow = {
  created_at: string;
  account_id: string;
  account: AccountRow;
};

const WISHLIST_SELECT = `
  created_at,
  account_id,
  account:accounts!inner(${ACCOUNT_SELECT})
`;

/**
 * Paginated feed for the /wishlist page. Ordered by the wishlist insertion
 * time (most recently saved first) with `account_id` as a tie-breaker so
 * cursor pagination is stable even if two saves land in the same microsecond.
 */
export async function getMyWishlistPage({
  limit = 24,
  cursor = null,
}: ListingQuery = {}): Promise<ListingPage> {
  const supabase = await createSupabaseServerClient();
  const {
    data: { user },
  } = await supabase.auth.getUser();
  if (!user) return { items: [], nextCursor: null };

  let query = supabase
    .from("wishlists")
    .select(WISHLIST_SELECT)
    .eq("user_id", user.id)
    .order("created_at", { ascending: false })
    .order("account_id", { ascending: false })
    .limit(limit + 1);

  if (cursor) {
    const payload = decodeCursor(cursor);
    if (payload) {
      query = query.or(
        `created_at.lt.${payload.c},and(created_at.eq.${payload.c},account_id.lt.${payload.i})`,
      );
    }
  }

  const { data, error } = await query;
  if (error || !data) return { items: [], nextCursor: null };

  const rows = data as unknown as WishlistRow[];
  const hasMore = rows.length > limit;
  const kept = hasMore ? rows.slice(0, limit) : rows;
  const last = kept[kept.length - 1];

  return {
    items: kept.map((row) => toAccount(row.account)),
    nextCursor:
      hasMore && last
        ? encodeCursor({ c: last.created_at, i: last.account_id })
        : null,
  };
}
