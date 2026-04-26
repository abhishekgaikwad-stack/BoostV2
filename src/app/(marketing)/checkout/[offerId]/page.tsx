import { ArrowLeft } from "lucide-react";
import Image from "next/image";
import Link from "next/link";
import { notFound } from "next/navigation";
import { CheckoutSummary } from "@/components/sections/CheckoutSummary";
import { gameImage } from "@/lib/images";
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

  const hero = offer.images?.[0];

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

      <div className="grid gap-6 lg:grid-cols-[1fr_400px]">
        <section className="flex flex-col gap-6 rounded-[32px] border border-brand-bg-pill bg-white p-6">
          <h2 className="font-display text-[14px] font-medium uppercase tracking-[0.1em] text-brand-text-secondary-light">
            Your order
          </h2>

          <div className="flex gap-4">
            <div className="relative aspect-square w-28 shrink-0 overflow-hidden rounded-2xl bg-brand-bg-pill">
              {hero ? (
                <Image
                  src={hero}
                  alt={offer.title}
                  fill
                  sizes="112px"
                  className="object-cover"
                  priority
                />
              ) : (
                <Image
                  src={gameImage(offer.game.slug)}
                  alt={offer.game.name}
                  fill
                  sizes="112px"
                  className="object-cover"
                />
              )}
            </div>
            <div className="flex min-w-0 flex-1 flex-col gap-2">
              <span className="w-fit rounded-full bg-brand-bg-pill px-3 py-1 font-display text-[12px] font-medium text-brand-text-primary-light">
                {offer.game.name}
              </span>
              <h3 className="font-display text-[18px] font-medium leading-6 text-brand-text-primary-light">
                {offer.title}
              </h3>
              <span className="font-display text-[12px] font-medium text-brand-text-secondary-light">
                Sold by {offer.seller.name}
              </span>
            </div>
            <div className="flex flex-col items-end gap-1">
              <span className="font-display text-[18px] font-medium leading-6 text-brand-text-primary-light">
                €{offer.price.toFixed(2)}
              </span>
              {offer.oldPrice ? (
                <span className="font-display text-[13px] font-medium text-brand-text-tertiary-dark line-through">
                  €{offer.oldPrice.toFixed(2)}
                </span>
              ) : null}
            </div>
          </div>
        </section>

        <CheckoutSummary offer={offer} />
      </div>
    </div>
  );
}
