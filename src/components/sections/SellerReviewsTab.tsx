import { ChevronLeft, ChevronRight, Star, User } from "lucide-react";
import Image from "next/image";
import Link from "next/link";
import { LocalDate } from "@/components/ui/LocalDate";
import type {
  ReviewSort,
  SellerReview,
  SellerReviewStats,
} from "@/lib/reviews";
import { cn } from "@/lib/utils";

const SORT_OPTIONS: Array<{ value: ReviewSort; label: string }> = [
  { value: "newest", label: "Newest" },
  { value: "highest", label: "Highest rated" },
  { value: "lowest", label: "Lowest rated" },
];

export function SellerReviewsTab({
  storeId,
  sellerName,
  stats,
  reviews,
  hasMore,
  sort,
  page,
}: {
  storeId: number;
  sellerName: string;
  stats: SellerReviewStats;
  reviews: SellerReview[];
  hasMore: boolean;
  sort: ReviewSort;
  page: number;
}) {
  const buildHref = (next: { sort?: ReviewSort; page?: number }) => {
    const params = new URLSearchParams({ tab: "reviews" });
    const nextSort = next.sort ?? sort;
    if (nextSort !== "newest") params.set("sort", nextSort);
    const nextPage = next.page ?? 0;
    if (nextPage > 0) params.set("page", String(nextPage));
    const qs = params.toString();
    return `/seller/${storeId}${qs ? `?${qs}` : ""}`;
  };

  if (stats.reviewCount === 0) {
    return (
      <div className="rounded-3xl border border-brand-border-light bg-brand-bg-light p-10 text-center font-display text-[14px] font-medium text-brand-text-secondary-light">
        No reviews for {sellerName} yet.
      </div>
    );
  }

  return (
    <div className="flex flex-col gap-6 lg:flex-row-reverse lg:items-start">
      <aside className="w-full shrink-0 rounded-[24px] bg-black p-6 text-white lg:sticky lg:top-[calc(var(--spacing)*12)] lg:w-[475px]">
        <RatingDistribution stats={stats} />
      </aside>

      <div className="flex min-w-0 flex-1 flex-col gap-4">
        <div className="flex flex-wrap items-center justify-between gap-3">
          <span className="font-display text-[13px] font-medium text-brand-text-secondary-light">
            {stats.reviewCount.toLocaleString()} review
            {stats.reviewCount === 1 ? "" : "s"}
          </span>
          <div className="flex items-center gap-2">
            {SORT_OPTIONS.map((opt) => {
              const active = opt.value === sort;
              return (
                <Link
                  key={opt.value}
                  href={buildHref({ sort: opt.value, page: 0 })}
                  className={cn(
                    "inline-flex h-9 items-center rounded-lg px-3 font-display text-[12px] font-medium transition",
                    active
                      ? "bg-black text-white"
                      : "border border-brand-border-light bg-white text-brand-text-secondary-light hover:bg-brand-bg-light",
                  )}
                >
                  {opt.label}
                </Link>
              );
            })}
          </div>
        </div>

        <ul className="flex flex-col gap-3">
          {reviews.map((review) => (
            <ReviewCard key={review.id} review={review} />
          ))}
        </ul>

        {page > 0 || hasMore ? (
          <div className="flex items-center justify-between gap-3">
            {page > 0 ? (
              <Link
                href={buildHref({ page: page - 1 })}
                className="inline-flex h-10 items-center gap-1 rounded-lg border border-brand-border-light bg-white px-4 font-display text-[13px] font-medium text-brand-text-primary-light transition hover:bg-brand-bg-light"
              >
                <ChevronLeft className="h-4 w-4" strokeWidth={1.5} />
                Previous
              </Link>
            ) : (
              <span />
            )}
            {hasMore ? (
              <Link
                href={buildHref({ page: page + 1 })}
                className="inline-flex h-10 items-center gap-1 rounded-lg border border-brand-border-light bg-white px-4 font-display text-[13px] font-medium text-brand-text-primary-light transition hover:bg-brand-bg-light"
              >
                Next
                <ChevronRight className="h-4 w-4" strokeWidth={1.5} />
              </Link>
            ) : (
              <span />
            )}
          </div>
        ) : null}
      </div>
    </div>
  );
}

function RatingDistribution({ stats }: { stats: SellerReviewStats }) {
  const total = stats.reviewCount;
  return (
    <div className="flex flex-col gap-6">
      <div className="flex flex-col gap-2">
        <span className="font-display text-[48px] font-medium leading-none text-white">
          {stats.avgRating.toFixed(1)}
        </span>
        <div className="flex items-center gap-1">
          {[1, 2, 3, 4, 5].map((value) => (
            <Star
              key={value}
              className={cn(
                "h-5 w-5",
                value <= Math.round(stats.avgRating)
                  ? "fill-brand-accent text-brand-accent"
                  : "text-brand-text-tertiary-dark",
              )}
              strokeWidth={1.5}
            />
          ))}
        </div>
        <span className="font-display text-[13px] text-brand-text-secondary-dark">
          Based on {total.toLocaleString()} review{total === 1 ? "" : "s"}
        </span>
      </div>

      <div className="flex flex-col gap-2 border-t border-brand-border-subtle pt-4">
        {([5, 4, 3, 2, 1] as const).map((star) => {
          const count = stats.distribution[star];
          const pct = total > 0 ? (count / total) * 100 : 0;
          return (
            <div
              key={star}
              className="flex items-center gap-3 font-display text-[12px] text-brand-text-secondary-dark"
            >
              <span className="flex w-10 shrink-0 items-center gap-1">
                {star}
                <Star
                  className="h-3 w-3 fill-brand-accent text-brand-accent"
                  strokeWidth={1.5}
                />
              </span>
              <div className="relative h-2 flex-1 overflow-hidden rounded-full bg-brand-bg-elevated">
                <div
                  className="absolute inset-y-0 left-0 rounded-full bg-brand-accent"
                  style={{ width: `${pct}%` }}
                />
              </div>
              <span className="w-10 shrink-0 text-right">
                {count.toLocaleString()}
              </span>
            </div>
          );
        })}
      </div>
    </div>
  );
}

function ReviewCard({ review }: { review: SellerReview }) {
  const edited = review.updatedAt !== review.createdAt;
  return (
    <li className="flex flex-col gap-3 rounded-2xl border border-brand-border-light bg-white p-5">
      <div className="flex items-start gap-3">
        <Avatar name={review.reviewerName} url={review.reviewerAvatarUrl} />
        <div className="flex min-w-0 flex-1 flex-col gap-1">
          <div className="flex items-baseline justify-between gap-3">
            <span className="truncate font-display text-[15px] font-medium leading-5 text-brand-text-primary-light">
              {review.reviewerName}
            </span>
            <span className="shrink-0 font-display text-[12px] text-brand-text-secondary-light">
              <LocalDate iso={review.updatedAt} format="date" />
              {edited ? " · edited" : ""}
            </span>
          </div>
          <div className="flex items-center gap-1">
            {[1, 2, 3, 4, 5].map((value) => (
              <Star
                key={value}
                className={cn(
                  "h-4 w-4",
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
        <p className="whitespace-pre-wrap font-display text-[14px] leading-5 text-brand-text-primary-light">
          {review.body}
        </p>
      ) : null}
      {review.offer ? (
        <Link
          href={`/games/${review.offer.gameSlug}/${review.offer.id}`}
          className="inline-flex w-fit items-center gap-2 rounded-md bg-brand-bg-pill px-2 py-1 font-display text-[11px] font-medium text-brand-text-primary-light transition hover:bg-brand-bg-light"
        >
          <span className="font-display text-[10px] text-brand-text-secondary-light">
            On
          </span>
          {review.offer.gameName}
        </Link>
      ) : null}
    </li>
  );
}

function Avatar({ name, url }: { name: string; url: string | null }) {
  const initial = name.trim().charAt(0).toUpperCase() || "?";
  return (
    <span className="relative grid h-10 w-10 shrink-0 place-items-center overflow-hidden rounded-full bg-brand-bg-pill text-brand-text-primary-light">
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
