import Link from "next/link";
import { redirect } from "next/navigation";
import { createSupabaseServerClient } from "@/lib/supabase/server";
import { getMySales } from "@/lib/orders";
import { OrderListRow } from "@/components/sections/OrderListRow";

/**
 * Seller-only chronological transaction log. Currently sources from
 * getMySales (every PAID row on the seller's listings) — when refunds /
 * payouts / fee events land later they'll show up here too without a
 * route change. Buyers see /user/orders instead.
 */
export default async function TransactionsPage() {
  const supabase = await createSupabaseServerClient();
  const {
    data: { user },
  } = await supabase.auth.getUser();
  if (!user) redirect("/");

  const { data: profile } = await supabase
    .from("profiles")
    .select("is_seller")
    .eq("id", user.id)
    .maybeSingle();
  if (!profile?.is_seller) {
    return (
      <div className="flex max-w-[560px] flex-col gap-4">
        <h1 className="font-display text-[28px] font-medium leading-8 text-brand-text-primary-light">
          Seller mode is off
        </h1>
        <p className="font-display text-[14px] leading-5 text-brand-text-secondary-light">
          Transactions are the seller-side activity log. Enable seller mode on
          your profile to see them.
        </p>
        <Link
          href="/profile"
          className="inline-flex h-12 w-fit items-center justify-center rounded-2xl bg-gradient-to-b from-brand-accent to-brand-accent-dark px-5 font-display text-[14px] font-medium text-brand-text-primary-light transition hover:brightness-95"
        >
          Go to profile
        </Link>
      </div>
    );
  }

  const { items: events } = await getMySales({ limit: 48 });

  return (
    <div className="flex max-w-[920px] flex-col gap-6">
      <div className="flex flex-col gap-1">
        <h1 className="font-display text-[28px] font-medium leading-8 text-brand-text-primary-light">
          Transactions
        </h1>
        <p className="font-display text-[13px] leading-5 text-brand-text-secondary-light">
          {events.length === 0
            ? "No transactions yet."
            : `${events.length} transaction${events.length === 1 ? "" : "s"} recorded.`}
        </p>
      </div>

      {events.length > 0 ? (
        <ul className="flex flex-col gap-3">
          {events.map((event) => (
            <OrderListRow
              key={event.id}
              order={event}
              href={`/sales/${event.id}`}
            />
          ))}
        </ul>
      ) : (
        <div className="rounded-3xl border border-brand-border-light bg-brand-bg-light p-10 text-center font-display text-[14px] font-medium text-brand-text-secondary-light">
          When buyers purchase your listings, the transactions will show up here.
        </div>
      )}
    </div>
  );
}
