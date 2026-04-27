import Link from "next/link";
import { redirect } from "next/navigation";
import { OrderCard } from "@/components/sections/OrderCard";
import { getMyPurchases } from "@/lib/orders";
import { createSupabaseServerClient } from "@/lib/supabase/server";

export default async function MyOrdersPage() {
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
          My orders
        </h1>
        <p className="font-display text-[13px] leading-5 text-brand-text-secondary-light">
          {orders.length === 0
            ? "You haven't placed any orders yet."
            : `${orders.length} order${orders.length === 1 ? "" : "s"} placed.`}
        </p>
      </div>

      {orders.length > 0 ? (
        <ul className="flex flex-col gap-4">
          {orders.map((order) => (
            <OrderCard key={order.id} order={order} />
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
          to place your first order.
        </div>
      )}
    </div>
  );
}
