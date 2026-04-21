import Link from "next/link";
import { redirect } from "next/navigation";
import type { SellerListingRowData } from "@/components/cards/SellerListingRow";
import { CurrentlySellingList } from "@/components/sections/CurrentlySellingList";
import { createSupabaseServerClient } from "@/lib/supabase/server";

type ListingRow = {
  id: string;
  title: string;
  price: number;
  old_price: number | null;
  images: string[];
  status: "AVAILABLE" | "RESERVED" | "SOLD";
  created_at: string;
  game: { slug: string; name: string };
};

export default async function CurrentlySellingPage() {
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
          Enable seller mode on your profile to start managing listings.
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

  const { data: raw } = await supabase
    .from("accounts")
    .select(
      "id, title, price, old_price, images, status, created_at, game:games(slug, name)",
    )
    .eq("seller_id", user.id)
    .order("created_at", { ascending: false });

  const listings: SellerListingRowData[] = ((raw ?? []) as unknown as ListingRow[]).map(
    (row) => ({
      id: row.id,
      title: row.title,
      price: row.price,
      oldPrice: row.old_price,
      images: row.images ?? [],
      status: row.status,
      createdAt: row.created_at,
      game: row.game,
    }),
  );

  return (
    <div className="flex max-w-[920px] flex-col gap-6">
      <div className="flex flex-wrap items-center justify-between gap-4">
        <div className="flex flex-col gap-1">
          <h1 className="font-display text-[28px] font-medium leading-8 text-brand-text-primary-light">
            Currently selling
          </h1>
          <p className="font-display text-[13px] leading-5 text-brand-text-secondary-light">
            {listings.length === 0
              ? "You haven't listed anything yet."
              : `${listings.length} listing${listings.length === 1 ? "" : "s"} across your store.`}
          </p>
        </div>
        <Link
          href="/sell"
          className="inline-flex h-11 items-center rounded-2xl bg-gradient-to-b from-brand-accent to-brand-accent-dark px-5 font-display text-[13px] font-medium text-brand-text-primary-light transition hover:brightness-95"
        >
          List a new account
        </Link>
      </div>

      {listings.length > 0 ? (
        <CurrentlySellingList listings={listings} />
      ) : (
        <div className="rounded-3xl border border-brand-border-light bg-brand-bg-light p-10 text-center font-display text-[14px] font-medium text-brand-text-secondary-light">
          Nothing to manage yet. Click{" "}
          <Link href="/sell" className="underline hover:text-brand-text-primary-light">
            List a new account
          </Link>{" "}
          to get started.
        </div>
      )}
    </div>
  );
}
