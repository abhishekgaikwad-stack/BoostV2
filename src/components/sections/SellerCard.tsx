import { Gamepad2, Star } from "lucide-react";
import Image from "next/image";
import Link from "next/link";
import type { OfferReview, Seller } from "@/types";

export function SellerCard({
  seller,
  reviews,
}: {
  seller: Seller;
  reviews: OfferReview[];
}) {
  return (
    <section className="flex flex-col gap-6 rounded-3xl bg-black p-6 text-white">
      <header className="flex flex-wrap items-center justify-between gap-6">
        <div className="flex items-start gap-4">
          <div className="relative h-16 w-16 shrink-0">
            <div className="h-16 w-16 overflow-hidden rounded-[999px] bg-brand-bg-elevated">
              {seller.avatarUrl ? (
                <Image
                  src={seller.avatarUrl}
                  alt={seller.name}
                  fill
                  sizes="64px"
                  className="rounded-[999px] object-cover"
                />
              ) : null}
            </div>
            {seller.isOnline ? (
              <span
                aria-hidden
                className="absolute right-0 top-1 h-4 w-4 rounded-full border-2 border-black bg-brand-success"
              />
            ) : null}
          </div>
          <div className="flex flex-col gap-2">
            <span className="font-display text-[12px] font-medium leading-4 text-brand-text-secondary-dark">
              {seller.isOnline ? "Online" : "Offline"}
            </span>
            <span className="font-display text-[16px] font-medium leading-5">
              {seller.name}
            </span>
            {seller.storeId ? (
              <Link
                href={`/seller/${seller.storeId}`}
                className="inline-flex w-fit items-center gap-2 rounded-xl bg-brand-bg-elevated px-3 py-2 font-display text-[14px] font-medium text-white transition hover:bg-brand-border"
              >
                <Gamepad2 className="h-4 w-4" strokeWidth={1.5} />
                Visit Store
              </Link>
            ) : null}
          </div>
        </div>

        <div className="flex flex-col gap-1 rounded-2xl bg-[#161616] px-5 py-3">
          <div className="flex items-center gap-2">
            <Star
              className="h-6 w-6 text-brand-accent"
              fill="currentColor"
              strokeWidth={0}
            />
            <span className="font-display text-[24px] font-medium leading-7 tracking-[-0.01em]">
              {seller.rating.toFixed(1)} Rating
            </span>
          </div>
          <span className="font-mono text-[12px] font-medium leading-4 uppercase tracking-[0.06em] text-brand-text-secondary-dark">
            OF {seller.reviewCount.toLocaleString()} reviews
          </span>
        </div>
      </header>

      <div className="flex flex-col gap-3">
        {reviews.map((review) => (
          <article
            key={review.id}
            className="flex flex-col gap-3 rounded-3xl bg-black p-3"
          >
            <div className="flex items-center justify-between gap-2">
              <div className="flex items-center gap-2">
                <div className="flex items-center gap-0.5">
                  {Array.from({ length: 5 }).map((_, i) => (
                    <Star
                      key={i}
                      className="h-4 w-4 text-brand-accent"
                      fill="currentColor"
                      strokeWidth={0}
                    />
                  ))}
                </div>
                <span className="font-display text-[12px] font-medium leading-4 text-brand-text-secondary-dark">
                  {review.rating.toFixed(1)}
                </span>
              </div>
              <span className="font-display text-[12px] font-medium leading-4 text-brand-text-secondary-dark">
                {review.date}
              </span>
            </div>
            <p className="font-display text-[12px] font-medium leading-4 text-white">
              {review.body}
            </p>
            <div className="flex items-center gap-3">
              <div className="h-10 w-10 rounded-full bg-[#d9d9d9]" />
              <div className="flex flex-col">
                <span className="font-display text-[12px] font-medium leading-4">
                  {review.user}
                </span>
                <span className="font-display text-[10px] font-medium leading-3 tracking-[0.05em] text-brand-text-secondary-dark">
                  {review.userSubtitle}
                </span>
              </div>
            </div>
          </article>
        ))}
      </div>
    </section>
  );
}
