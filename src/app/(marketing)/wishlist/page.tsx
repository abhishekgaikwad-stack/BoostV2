import { ArrowLeft } from "lucide-react";
import Link from "next/link";
import { redirect } from "next/navigation";
import { ProductCard } from "@/components/cards/ProductCard";
import { createSupabaseServerClient } from "@/lib/supabase/server";
import { getMyWishlistPage } from "@/lib/wishlist";

export default async function WishlistPage() {
  const supabase = await createSupabaseServerClient();
  const {
    data: { user },
  } = await supabase.auth.getUser();
  if (!user) redirect("/");

  const { items: offers } = await getMyWishlistPage({ limit: 48 });

  return (
    <div className="flex flex-col gap-8">
      <Link
        href="/"
        className="inline-flex w-fit items-center gap-2 rounded-xl border border-brand-border-light bg-white px-4 py-2 font-display text-[14px] font-medium text-brand-text-primary-light transition hover:bg-brand-bg-light"
      >
        <ArrowLeft className="h-4 w-4" strokeWidth={1.5} />
        Home
      </Link>

      <h1 className="font-display text-[28px] font-medium leading-8 text-brand-text-primary-light">
        Wishlist
      </h1>

      {offers.length > 0 ? (
        <div className="grid grid-cols-1 gap-4 sm:grid-cols-2 md:grid-cols-3 lg:grid-cols-4 xl:grid-cols-5">
          {offers.map((offer) => (
            <ProductCard key={offer.id} account={offer} />
          ))}
        </div>
      ) : (
        <div className="rounded-3xl border border-brand-border-light bg-brand-bg-light p-10 text-center font-display text-[14px] font-medium text-brand-text-secondary-light">
          No saved listings yet. Tap the heart on any listing to add it here.
        </div>
      )}
    </div>
  );
}
