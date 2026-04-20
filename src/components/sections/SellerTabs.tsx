"use client";

import { Star } from "lucide-react";
import { useState } from "react";
import { SellerListings } from "@/components/sections/SellerListings";
import { cn } from "@/lib/utils";
import type { Account, OfferReview } from "@/types";

type Tab = "listings" | "reviews";

export function SellerTabs({
  offers,
  reviews,
  sellerName,
}: {
  offers: Account[];
  reviews: OfferReview[];
  sellerName: string;
}) {
  const [active, setActive] = useState<Tab>("listings");

  return (
    <div className="flex flex-col gap-6">
      <div
        role="tablist"
        className="flex gap-6 border-b border-brand-border-light"
      >
        <TabButton
          label={`All listings (${offers.length})`}
          active={active === "listings"}
          onClick={() => setActive("listings")}
        />
        <TabButton
          label={`Reviews (${reviews.length})`}
          active={active === "reviews"}
          onClick={() => setActive("reviews")}
        />
      </div>

      {active === "listings" ? (
        <SellerListings
          offers={offers}
          emptyLabel={`${sellerName} has no active listings right now.`}
        />
      ) : reviews.length > 0 ? (
        <div className="flex flex-col gap-3 rounded-[32px] bg-black p-6 text-white sm:p-8">
          <div className="grid grid-cols-1 gap-3 sm:grid-cols-2">
            {reviews.map((review) => (
              <ReviewBlock key={review.id} review={review} />
            ))}
          </div>
        </div>
      ) : (
        <div className="rounded-3xl border border-brand-border-light bg-brand-bg-light p-10 text-center font-display text-[14px] font-medium text-brand-text-secondary-light">
          No reviews for {sellerName} yet.
        </div>
      )}
    </div>
  );
}

function TabButton({
  label,
  active,
  onClick,
}: {
  label: string;
  active: boolean;
  onClick: () => void;
}) {
  return (
    <button
      type="button"
      role="tab"
      aria-selected={active}
      onClick={onClick}
      className={cn(
        "relative pb-3 font-display text-[14px] font-medium transition",
        active
          ? "text-brand-text-primary-light after:absolute after:bottom-0 after:left-0 after:right-0 after:h-0.5 after:bg-brand-accent-dark"
          : "text-brand-text-secondary-light hover:text-brand-text-primary-light",
      )}
    >
      {label}
    </button>
  );
}

function ReviewBlock({ review }: { review: OfferReview }) {
  return (
    <article className="flex flex-col gap-3 rounded-2xl bg-brand-bg-elevated p-4">
      <div className="flex items-center justify-between">
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
      <p className="font-display text-[12px] font-medium leading-4">
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
  );
}
