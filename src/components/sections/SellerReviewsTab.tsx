import { ChevronLeft, ChevronRight, Star } from "lucide-react";
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
    <div className="flex flex-col gap-6">
      <RatingDistribution stats={stats} />

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

      {(page > 0 || hasMore) ? (
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
  );
}

function RatingDistribution({ stats }: { stats: SellerReviewStats }) {
  const total = stats.reviewCount;
  return (
    <div className="grid grid-cols-1 gap-6 rounded-[24px] border border-brand-border-light bg-white p-6 sm:grid-cols-[200px_1fr]">
      <div className="flex flex-col items-center gap-2 sm:items-start">
        <span className="font-display text-[40px] font-medium leading-none text-brand-text-primary-light">
          {stats.avgRating.toFixed(1)}
        </span>
        <div className="flex items-center gap-0.5">
          {[1, 2, 3, 4, 5].map((value) => (
            <Star
              key={value}
              className={cn(
                "h-4 w-4",
                value <= Math.round(stats.avgRating)
                  ? "fill-brand-accent text-brand-accent"
                  : "text-brand-text-tertiary-dark",
              )}
              strokeWidth={1.5}
            />
          ))}
        </div>
        <span className="font-display text-[12px] text-brand-text-secondary-light">
          {total.toLocaleString()} review{total === 1 ? "" : "s"}
        </span>
      </div>
      <div className="flex flex-col gap-2">
        {([5, 4, 3, 2, 1] as const).map((star) => {
          const count = stats.distribution[star];
          const pct = total > 0 ? (count / total) * 100 : 0;
          return (
            <div
              key={star}
              className="flex items-center gap-3 font-display text-[12px] text-brand-text-secondary-light"
            >
              <span className="w-8 shrink-0">{star} ★</span>
              <div className="relative h-2 flex-1 overflow-hidden rounded-full bg-brand-bg-pill">
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
      <div className="flex flex-wrap items-center justify-between gap-2">
        <div className="flex items-center gap-2">
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
          <span className="font-display text-[13px] font-medium text-brand-text-primary-light">
            {review.reviewerName}
          </span>
        </div>
        <span className="font-display text-[12px] text-brand-text-secondary-light">
          <LocalDate iso={review.updatedAt} format="date" />
          {edited ? " · edited" : ""}
        </span>
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
          <span className="font-mono text-[10px] uppercase tracking-[0.05em] text-brand-text-secondary-light">
            On
          </span>
          {review.offer.title}
        </Link>
      ) : null}
    </li>
  );
}
