import { ArrowLeft } from "lucide-react";
import Link from "next/link";
import { notFound } from "next/navigation";
import { BuyBox } from "@/components/sections/BuyBox";
import { OfferDescription } from "@/components/sections/OfferDescription";
import { OfferGallery } from "@/components/sections/OfferGallery";
import { SellerCard } from "@/components/sections/SellerCard";
import { SimilarAccounts } from "@/components/sections/SimilarAccounts";
import { findOffer, similarOffers } from "@/lib/offers";
import {
  getMyPurchaseForListing,
  getMySaleForListing,
} from "@/lib/orders";
import { getSellerReviewStats, getSellerReviewsPage } from "@/lib/reviews";
import { resolveSellerProfile } from "@/lib/sellers";
import { createSupabaseServerClient } from "@/lib/supabase/server";

export default async function OfferPage({
  params,
}: {
  params: Promise<{ slug: string; id: string }>;
}) {
  const { slug, id } = await params;

  const offer = await findOffer(slug, id);
  if (!offer) notFound();

  const similar = await similarOffers(slug, id);

  // Pull the seller's real name/avatar from Supabase when available so the
  // offer page, Visit Store link, and /seller/<storeId> page agree.
  const realSeller = offer.seller.storeId
    ? await resolveSellerProfile(offer.seller.storeId)
    : null;
  const seller = realSeller
    ? {
        ...offer.seller,
        name: realSeller.name,
        avatarUrl: realSeller.avatarUrl,
      }
    : offer.seller;

  // BuyBox needs the viewer's identity to know whether this is their own
  // listing (owner mode), and any related order to link into /transactions
  // or /sales when the listing has been bought/sold.
  const supabase = await createSupabaseServerClient();
  const {
    data: { user },
  } = await supabase.auth.getUser();
  const viewerId = user?.id ?? null;
  const isOwner = viewerId !== null && viewerId === offer.seller.id;
  const relatedOrder = viewerId
    ? isOwner
      ? await getMySaleForListing(offer.id)
      : await getMyPurchaseForListing(offer.id)
    : null;

  // Seller-wide review stats + recent reviews for the block under the
  // listing description.
  const [sellerStats, sellerReviews] = await Promise.all([
    getSellerReviewStats(offer.seller.id),
    getSellerReviewsPage({
      sellerId: offer.seller.id,
      sort: "newest",
      page: 0,
      limit: 5,
    }),
  ]);

  return (
    <div className="flex flex-col gap-8">
      <Link
        href={`/games/${slug}`}
        className="inline-flex w-fit items-center gap-2 rounded-xl border border-brand-border-light bg-white px-4 py-2 font-display text-[14px] font-medium text-brand-text-primary-light transition hover:bg-brand-bg-light"
      >
        <ArrowLeft className="h-4 w-4" strokeWidth={1.5} />
        {offer.game.name} accounts
      </Link>

      <h1 className="font-display text-[28px] font-medium leading-8 text-brand-text-primary-light">
        {offer.title}
      </h1>

      <div className="grid gap-6 lg:grid-cols-[1fr_400px]">
        <div className="flex flex-col gap-6 rounded-[32px] border border-brand-bg-pill bg-white p-6">
          <OfferGallery offer={offer} />
          <OfferDescription description={offer.description} />
          <SellerCard
            seller={seller}
            stats={sellerStats}
            reviews={sellerReviews.items}
          />
        </div>
        <BuyBox
          offer={offer}
          isOwner={isOwner}
          relatedOrderId={relatedOrder?.orderId ?? null}
        />
      </div>

      <SimilarAccounts accounts={similar} />
    </div>
  );
}
