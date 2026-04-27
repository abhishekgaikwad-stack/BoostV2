import { ArrowLeft } from "lucide-react";
import Link from "next/link";
import { notFound } from "next/navigation";
import { CheckoutBoard } from "@/components/sections/CheckoutBoard";
import { findOfferById } from "@/lib/offers";
import { createSupabaseServerClient } from "@/lib/supabase/server";
import { CheckoutSignInPrompt } from "./CheckoutSignInPrompt";

export default async function CheckoutPage({
  params,
}: {
  params: Promise<{ offerId: string }>;
}) {
  const { offerId } = await params;

  const offer = await findOfferById(offerId);
  if (!offer) notFound();

  const backHref = `/games/${offer.game.slug}/${offer.id}`;

  const supabase = await createSupabaseServerClient();
  const {
    data: { user },
  } = await supabase.auth.getUser();

  if (!user) {
    return <CheckoutSignInPrompt backHref={backHref} />;
  }

  return (
    <div className="flex flex-col gap-8">
      <Link
        href={backHref}
        className="inline-flex w-fit items-center gap-2 rounded-xl border border-brand-border-light bg-white px-4 py-2 font-display text-[14px] font-medium text-brand-text-primary-light transition hover:bg-brand-bg-light"
      >
        <ArrowLeft className="h-4 w-4" strokeWidth={1.5} />
        Back to listing
      </Link>

      <h1 className="font-display text-[28px] font-medium leading-8 text-brand-text-primary-light">
        Checkout
      </h1>

      <CheckoutBoard offer={offer} />
    </div>
  );
}
