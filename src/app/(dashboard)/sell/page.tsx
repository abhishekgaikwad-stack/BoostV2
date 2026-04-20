import Link from "next/link";
import { redirect } from "next/navigation";
import { CreateListingForm } from "@/components/sections/CreateListingForm";
import { listGames } from "@/lib/offers";
import { createSupabaseServerClient } from "@/lib/supabase/server";

export default async function SellPage() {
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
          Become a seller first
        </h1>
        <p className="font-display text-[14px] leading-5 text-brand-text-secondary-light">
          Enable seller mode on your profile to start listing accounts — it
          takes one click and assigns you a store ID.
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

  const games = await listGames(50);

  return (
    <div className="flex max-w-[640px] flex-col gap-6">
      <div className="flex flex-col gap-2">
        <h1 className="font-display text-[28px] font-medium leading-8 text-brand-text-primary-light">
          List a new account
        </h1>
        <p className="font-display text-[14px] leading-5 text-brand-text-secondary-light">
          Fill in the essentials. You can add region, level, rank, and images
          from the edit page once the listing is up.
        </p>
      </div>
      <CreateListingForm games={games} />
    </div>
  );
}
