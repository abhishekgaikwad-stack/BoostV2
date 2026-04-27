import Link from "next/link";
import { redirect } from "next/navigation";
import { createSupabaseServerClient } from "@/lib/supabase/server";
import { getMyPurchases } from "@/lib/orders";
import { OrderListRow } from "@/components/sections/OrderListRow";

export default async function TransactionsPage() {
  const supabase = await createSupabaseServerClient();
  const {
    data: { user },
  } = await supabase.auth.getUser();
  if (!user) redirect("/");

  const { items: orders } = await getMyPurchases({ limit: 48 });

  return (
    <div className="flex max-w-[920px] flex-col gap-6">
      <div className="flex flex-col gap-1">
        <h1 className="font-display text-[28px] font-medium leading-8 text-brand-text-primary-light">
          Transactions
        </h1>
        <p className="font-display text-[13px] leading-5 text-brand-text-secondary-light">
          {orders.length === 0
            ? "You haven't bought anything yet."
            : `${orders.length} purchase${orders.length === 1 ? "" : "s"}.`}
        </p>
      </div>

      {orders.length > 0 ? (
        <ul className="flex flex-col gap-3">
          {orders.map((order) => (
            <OrderListRow
              key={order.id}
              order={order}
              href={`/transactions/${order.id}`}
            />
          ))}
        </ul>
      ) : (
        <div className="rounded-3xl border border-brand-border-light bg-brand-bg-light p-10 text-center font-display text-[14px] font-medium text-brand-text-secondary-light">
          Browse the{" "}
          <Link
            href="/"
            className="underline hover:text-brand-text-primary-light"
          >
            marketplace
          </Link>{" "}
          to make your first purchase.
        </div>
      )}
    </div>
  );
}
