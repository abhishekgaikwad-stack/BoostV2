import { createSupabaseServerClient } from "@/lib/supabase/server";

export type OrderRow = {
  id: string;
  transaction_id: string;
  price_cents: number;
  payment_method: string;
  status: "PENDING" | "PAID" | "DELIVERED" | "REFUNDED";
  created_at: string;
  account: {
    id: string;
    title: string;
    images: string[] | null;
    game: { id: string; slug: string; name: string };
  } | null;
};

export type Order = {
  id: string;
  transactionId: string;
  price: number;
  paymentMethod: string;
  status: OrderRow["status"];
  createdAt: string;
  offer: {
    id: string;
    title: string;
    image: string | null;
    game: { slug: string; name: string };
  } | null;
};

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
        }
      : null,
  };
}

export async function getMyOrder(orderId: string): Promise<Order | null> {
  const supabase = await createSupabaseServerClient();
  const {
    data: { user },
  } = await supabase.auth.getUser();
  if (!user) return null;

  const { data, error } = await supabase
    .from("orders")
    .select(
      `
      id, transaction_id, price_cents, payment_method, status, created_at,
      account:accounts(
        id, title, images,
        game:games(id, slug, name)
      )
      `,
    )
    .eq("id", orderId)
    .eq("buyer_id", user.id)
    .maybeSingle();

  if (error || !data) return null;
  return toOrder(data as unknown as OrderRow);
}
