import Link from "next/link";
import { redirect } from "next/navigation";
import { createSupabaseServerClient } from "@/lib/supabase/server";
import { getMySales } from "@/lib/orders";
import { OrderListRow } from "@/components/sections/OrderListRow";

export default async function SalesPage() {
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
          Enable seller mode on your profile to see sales.
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

  const { items: sales } = await getMySales({ limit: 48 });

  return (
    <div className="flex max-w-[920px] flex-col gap-6">
      <div className="flex flex-col gap-1">
        <h1 className="font-display text-[28px] font-medium leading-8 text-brand-text-primary-light">
          Sales
        </h1>
        <p className="font-display text-[13px] leading-5 text-brand-text-secondary-light">
          {sales.length === 0
            ? "You haven't sold anything yet."
            : `${sales.length} sale${sales.length === 1 ? "" : "s"}.`}
        </p>
      </div>

      {sales.length > 0 ? (
        <ul className="flex flex-col gap-3">
          {sales.map((sale) => (
            <OrderListRow
              key={sale.id}
              order={sale}
              href={`/sales/${sale.id}`}
            />
          ))}
        </ul>
      ) : (
        <div className="rounded-3xl border border-brand-border-light bg-brand-bg-light p-10 text-center font-display text-[14px] font-medium text-brand-text-secondary-light">
          When buyers purchase your listings, the sales will show up here.
        </div>
      )}
    </div>
  );
}
