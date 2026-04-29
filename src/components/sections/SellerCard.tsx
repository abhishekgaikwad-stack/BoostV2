import { ArrowRight, Gamepad2, Star, User } from "lucide-react";
import Image from "next/image";
import Link from "next/link";
import { LocalDate } from "@/components/ui/LocalDate";
import type { SellerReview, SellerReviewStats } from "@/lib/reviews";
import type { Seller } from "@/types";
import { cn } from "@/lib/utils";

/**
 * Seller identity + seller-wide rating aggregate + recent reviews,
 * rendered as a single dark card on the PDP under the listing
 * description. Stats / reviews come from getSellerReviewStats and
 * getSellerReviewsPage in the parent route — both real DB data.
 */
export function SellerCard({
  seller,
  stats,
  reviews,
}: {
  seller: Seller;
  stats: SellerReviewStats;
  reviews: SellerReview[];
}) {
  return (
    <section className="flex flex-col gap-6 rounded-3xl bg-black p-6 text-white">
      <div className="flex flex-wrap items-center justify-between gap-4">
        <div className="flex items-center gap-4">
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
          <div className="flex flex-col gap-1">
            <span className="font-display text-[12px] font-medium leading-4 text-brand-text-secondary-dark">
              {seller.isOnline ? "Online" : "Offline"}
            </span>
            <span className="font-display text-[16px] font-medium leading-5">
              {seller.name}
            </span>
          </div>
        </div>
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

      <div className="flex flex-col gap-4 border-t border-brand-border-subtle pt-5">
        <div className="flex flex-wrap items-center justify-between gap-3">
          <div className="flex items-center gap-3">
            <Star
              className="h-6 w-6 fill-brand-accent text-brand-accent"
              strokeWidth={0}
            />
            <span className="font-display text-[20px] font-medium leading-6">
              {stats.reviewCount > 0
                ? `${stats.avgRating.toFixed(1)} Rating`
                : "No reviews yet"}
            </span>
            <span className="font-display text-[12px] text-brand-text-secondary-dark">
              ({stats.reviewCount.toLocaleString()} review
              {stats.reviewCount === 1 ? "" : "s"})
            </span>
          </div>
          {seller.storeId ? (
            <Link
              href={`/seller/${seller.storeId}?tab=reviews`}
              className="inline-flex items-center gap-1 font-display text-[12px] font-medium text-brand-accent transition hover:text-white"
            >
              See all reviews
              <ArrowRight className="h-3.5 w-3.5" strokeWidth={1.75} />
            </Link>
          ) : null}
        </div>

        {reviews.length === 0 ? (
          <p className="font-display text-[13px] text-brand-text-secondary-dark">
            This seller hasn&rsquo;t received any reviews yet.
          </p>
        ) : (
          <ul className="flex flex-col gap-3">
            {reviews.map((review) => (
              <ReviewRow key={review.id} review={review} />
            ))}
          </ul>
        )}
      </div>
    </section>
  );
}

function ReviewRow({ review }: { review: SellerReview }) {
  return (
    <li className="flex flex-col gap-3 rounded-2xl bg-brand-bg-elevated p-4">
      <div className="flex items-start gap-3">
        <Avatar name={review.reviewerName} url={review.reviewerAvatarUrl} />
        <div className="flex min-w-0 flex-1 flex-col gap-0.5">
          <div className="flex items-baseline justify-between gap-3">
            <span className="truncate font-display text-[14px] font-medium leading-5 text-white">
              {review.reviewerName}
            </span>
            <span className="shrink-0 font-display text-[11px] text-brand-text-secondary-dark">
              <LocalDate iso={review.updatedAt} format="date" />
            </span>
          </div>
          <span className="font-display text-[10px] text-brand-text-secondary-dark">
            {review.offer?.gameName ?? "—"}
          </span>
          <div className="mt-1 flex items-center gap-0.5">
            {[1, 2, 3, 4, 5].map((value) => (
              <Star
                key={value}
                className={cn(
                  "h-3.5 w-3.5",
                  value <= review.rating
                    ? "fill-brand-accent text-brand-accent"
                    : "text-brand-text-tertiary-dark",
                )}
                strokeWidth={1.5}
              />
            ))}
          </div>
        </div>
      </div>
      {review.body ? (
        <p className="whitespace-pre-wrap font-display text-[13px] leading-5 text-white">
          {review.body}
        </p>
      ) : null}
    </li>
  );
}

function Avatar({ name, url }: { name: string; url: string | null }) {
  const initial = name.trim().charAt(0).toUpperCase() || "?";
  return (
    <span className="relative grid h-10 w-10 shrink-0 place-items-center overflow-hidden rounded-full bg-brand-border text-white">
      {url ? (
        <Image src={url} alt="" fill sizes="40px" className="object-cover" />
      ) : initial !== "?" ? (
        <span className="font-display text-[14px] font-medium">{initial}</span>
      ) : (
        <User className="h-5 w-5" strokeWidth={1.5} />
      )}
    </span>
  );
}
