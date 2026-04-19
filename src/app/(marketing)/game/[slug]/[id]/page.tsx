import { ArrowLeft } from "lucide-react";
import Link from "next/link";
import { notFound } from "next/navigation";
import { BuyBox } from "@/components/sections/BuyBox";
import { OfferDescription } from "@/components/sections/OfferDescription";
import { OfferGallery } from "@/components/sections/OfferGallery";
import { SellerCard } from "@/components/sections/SellerCard";
import { SimilarAccounts } from "@/components/sections/SimilarAccounts";
import { findOffer, similarOffers } from "@/lib/mock";

export default async function OfferPage({
  params,
}: {
  params: Promise<{ slug: string; id: string }>;
}) {
  const { slug, id } = await params;

  const offer = findOffer(slug, id);
  if (!offer) notFound();

  const similar = similarOffers(slug, id);

  return (
    <div className="flex flex-col gap-8">
      <Link
        href={`/games/${slug}`}
        className="inline-flex w-fit items-center gap-2 rounded-xl border border-brand-border-light bg-white px-4 py-2 font-display text-[14px] font-medium text-brand-text-primary-light transition hover:bg-brand-bg-light"
      >
        <ArrowLeft className="h-4 w-4" strokeWidth={1.5} />
        {offer.game} accounts
      </Link>

      <h1 className="font-display text-[28px] font-medium leading-8 text-brand-text-primary-light">
        {offer.title}
      </h1>

      <div className="grid gap-6 lg:grid-cols-[1fr_320px]">
        <div className="flex flex-col gap-6 rounded-[32px] border border-brand-bg-pill bg-white p-6">
          <OfferGallery offer={offer} />
          <OfferDescription description={offer.description} />
          <SellerCard seller={offer.seller} reviews={offer.reviews} />
        </div>
        <BuyBox offer={offer} />
      </div>

      <SimilarAccounts accounts={similar} />
    </div>
  );
}
