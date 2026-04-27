import {
  decodeCursor,
  encodeCursor,
  type ListingCursor,
} from "@/lib/offers";
import { createSupabaseServerClient } from "@/lib/supabase/server";

export type OrderStatus = "PENDING" | "PAID" | "DELIVERED" | "REFUNDED";

export type OrderRow = {
  id: string;
  transaction_id: string;
  price_cents: number;
  payment_method: string;
  status: OrderStatus;
  created_at: string;
  account: {
    id: string;
    title: string;
    images: string[] | null;
    game: { id: string; slug: string; name: string };
    seller: { name: string | null; store_id: number | null } | null;
  } | null;
};

export type Order = {
  id: string;
  transactionId: string;
  price: number;
  paymentMethod: string;
  status: OrderStatus;
  createdAt: string;
  offer: {
    id: string;
    title: string;
    image: string | null;
    game: { slug: string; name: string };
    seller: { name: string; storeId: number | null };
  } | null;
};

/**
 * The seller's view of an order. By design this carries NO buyer-identifying
 * fields — sellers see what they sold, when, for how much, but not who
 * bought it. Until the credential-delivery flow exists, the buyer stays
 * anonymous from the seller's side.
 */
export type Sale = Order;

const ORDER_SELECT = `
  id, transaction_id, price_cents, payment_method, status, created_at,
  account:accounts(
    id, title, images,
    game:games(id, slug, name),
    seller:profiles(name, store_id)
  )
`;

function toOrder(row: OrderRow): Order {
  return {
    id: row.id,
    transactionId: row.transaction_id,
    price: row.price_cents / 100,
    paymentMethod: row.payment_method,
    status: row.status,
    createdAt: row.created_at,
    offer: row.account
      ? {
          id: row.account.id,
          title: row.account.title,
          image: row.account.images?.[0] ?? null,
          game: {
            slug: row.account.game.slug,
            name: row.account.game.name,
          },
          seller: {
            name: row.account.seller?.name ?? "Seller",
            storeId: row.account.seller?.store_id ?? null,
          },
        }
      : null,
  };
}

export type OrderListPage = {
  items: Order[];
  nextCursor: ListingCursor | null;
};

type ListInput = {
  limit?: number;
  cursor?: ListingCursor | null;
};

const DEFAULT_ORDER_LIMIT = 24;

async function getMyOrdersBy(
  column: "buyer_id" | "seller_id",
  { limit = DEFAULT_ORDER_LIMIT, cursor = null }: ListInput,
): Promise<OrderListPage> {
  const supabase = await createSupabaseServerClient();
  const {
    data: { user },
  } = await supabase.auth.getUser();
  if (!user) return { items: [], nextCursor: null };

  let query = supabase
    .from("orders")
    .select(ORDER_SELECT)
    .eq(column, user.id)
    .order("created_at", { ascending: false })
    .order("id", { ascending: false })
    .limit(limit + 1);

  if (cursor) {
    const payload = decodeCursor(cursor);
    if (payload) {
      query = query.or(
        `created_at.lt.${payload.c},and(created_at.eq.${payload.c},id.lt.${payload.i})`,
      );
    }
  }

  const { data, error } = await query;
  if (error || !data) return { items: [], nextCursor: null };

  const rows = data as unknown as OrderRow[];
  const hasMore = rows.length > limit;
  const kept = hasMore ? rows.slice(0, limit) : rows;
  const last = kept[kept.length - 1];

  return {
    items: kept.map(toOrder),
    nextCursor:
      hasMore && last
        ? encodeCursor({ c: last.created_at, i: last.id })
        : null,
  };
}

export function getMyPurchases(input: ListInput = {}): Promise<OrderListPage> {
  return getMyOrdersBy("buyer_id", input);
}

export function getMySales(input: ListInput = {}): Promise<OrderListPage> {
  return getMyOrdersBy("seller_id", input);
}

export async function getMyOrder(orderId: string): Promise<Order | null> {
  const supabase = await createSupabaseServerClient();
  const {
    data: { user },
  } = await supabase.auth.getUser();
  if (!user) return null;

  const { data, error } = await supabase
    .from("orders")
    .select(ORDER_SELECT)
    .eq("id", orderId)
    .eq("buyer_id", user.id)
    .maybeSingle();

  if (error || !data) return null;
  return toOrder(data as unknown as OrderRow);
}

export async function getMySale(orderId: string): Promise<Sale | null> {
  const supabase = await createSupabaseServerClient();
  const {
    data: { user },
  } = await supabase.auth.getUser();
  if (!user) return null;

  const { data, error } = await supabase
    .from("orders")
    .select(ORDER_SELECT)
    .eq("id", orderId)
    .eq("seller_id", user.id)
    .maybeSingle();

  if (error || !data) return null;
  return toOrder(data as unknown as OrderRow);
}

export type ListingOrderRef = {
  orderId: string;
  createdAt: string;
  status: OrderStatus;
};

/**
 * "Has the signed-in user already transacted on this listing?" — used by the
 * PDP to flip the BuyBox into "You bought this" / "You sold this" mode and
 * link to the right detail page.
 */
async function getMyOrderForListingBy(
  column: "buyer_id" | "seller_id",
  accountId: string,
): Promise<ListingOrderRef | null> {
  const supabase = await createSupabaseServerClient();
  const {
    data: { user },
  } = await supabase.auth.getUser();
  if (!user) return null;

  const { data, error } = await supabase
    .from("orders")
    .select("id, created_at, status")
    .eq(column, user.id)
    .eq("account_id", accountId)
    .order("created_at", { ascending: false })
    .limit(1)
    .maybeSingle();

  if (error || !data) return null;
  return {
    orderId: data.id as string,
    createdAt: data.created_at as string,
    status: data.status as OrderStatus,
  };
}

export function getMyPurchaseForListing(
  accountId: string,
): Promise<ListingOrderRef | null> {
  return getMyOrderForListingBy("buyer_id", accountId);
}

export function getMySaleForListing(
  accountId: string,
): Promise<ListingOrderRef | null> {
  return getMyOrderForListingBy("seller_id", accountId);
}
