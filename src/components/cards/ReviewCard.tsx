import { Star } from "lucide-react";
import type { Review } from "@/types";
import { cn } from "@/lib/utils";

export function ReviewCard({
  review,
  className,
}: {
  review: Review;
  className?: string;
}) {
  return (
    <article
      className={cn(
        "flex flex-col justify-between gap-6 rounded-2xl border border-brand-border-subtle bg-brand-bg-surface p-5 text-brand-text-primary-dark",
        className,
      )}
    >
      <div className="flex flex-col gap-4">
        <div className="flex items-center justify-between">
          <div className="flex items-center gap-2">
            <div className="flex items-center gap-0.5">
              {Array.from({ length: 5 }).map((_, i) => (
                <Star
                  key={i}
                  className={cn(
                    "h-3.5 w-3.5",
                    i < review.rating
                      ? "fill-brand-accent text-brand-accent"
                      : "text-brand-border",
                  )}
                />
              ))}
            </div>
            <span className="font-display text-[12px] font-medium leading-4">
              {review.rating.toFixed(1)}
            </span>
          </div>
          <span className="font-display text-[12px] font-medium leading-4 text-brand-text-secondary-dark">
            {review.date}
          </span>
        </div>
        <p className="font-display text-[13px] font-medium leading-5 text-brand-text-primary-dark">
          {review.body}
        </p>
      </div>
      <footer className="flex items-center gap-3 border-t border-brand-border-subtle pt-4">
        <div className="h-8 w-8 rounded-full bg-brand-bg-pill" />
        <div className="flex flex-col">
          <span className="font-display text-[12px] font-medium leading-4">
            {review.user}
          </span>
          <span className="font-display text-[10px] font-medium leading-3 text-brand-text-secondary-dark">
            {review.userSubtitle}
          </span>
        </div>
      </footer>
    </article>
  );
}
