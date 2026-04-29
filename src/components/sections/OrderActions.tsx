"use client";

import { Eye, Pencil, Star } from "lucide-react";
import { useState } from "react";
import { ReviewDialog } from "@/components/sections/ReviewDialog";
import { RevealOrderDetailsDialog } from "@/components/sections/RevealOrderDetailsDialog";
import { isWithinEditWindow, type MyReview } from "@/lib/review-types";
import type { Order } from "@/lib/orders";

type Props = {
  order: Order;
  myReview: MyReview | null;
};

/**
 * Owns both the reveal dialog and the review dialog so we can chain them
 * after a successful Confirm-receipt submit (the auto-open review-popup
 * step in the post-purchase flow).
 *
 * Replaces the standalone RevealOrderDetailsButton on the order detail
 * page; renders both action buttons inline.
 */
export function OrderActions({ order, myReview }: Props) {
  const [revealOpen, setRevealOpen] = useState(false);
  const [reviewOpen, setReviewOpen] = useState(false);

  const isAlreadyRevealed = Boolean(order.revealedAt);
  const revealLabel = isAlreadyRevealed
    ? "View order details"
    : "Reveal order details";

  const hasReview = Boolean(myReview);
  const canEditReview = myReview ? isWithinEditWindow(myReview.createdAt) : false;
  const reviewLabel = hasReview
    ? canEditReview
      ? "Edit review"
      : "View your review"
    : "Leave a review";

  // After Confirm-receipt success the reveal dialog closes; if the buyer
  // hasn't reviewed yet, surface the review popup automatically.
  const handleConfirmedReceipt = () => {
    if (!hasReview) {
      setReviewOpen(true);
    }
  };

  return (
    <>
      <button
        type="button"
        onClick={() => setRevealOpen(true)}
        className="inline-flex h-12 items-center justify-center gap-2 rounded-xl border border-brand-border-light bg-white font-display text-[14px] font-medium text-brand-text-primary-light transition hover:bg-brand-bg-light"
      >
        <Eye className="h-4 w-4" strokeWidth={1.75} />
        {revealLabel}
      </button>

      <button
        type="button"
        onClick={() => setReviewOpen(true)}
        className="inline-flex h-12 items-center justify-center gap-2 rounded-xl border border-brand-border-light bg-white font-display text-[14px] font-medium text-brand-text-primary-light transition hover:bg-brand-bg-light"
      >
        {hasReview ? (
          canEditReview ? (
            <Pencil className="h-4 w-4" strokeWidth={1.75} />
          ) : (
            <Star className="h-4 w-4" strokeWidth={1.75} />
          )
        ) : (
          <Star className="h-4 w-4" strokeWidth={1.75} />
        )}
        {reviewLabel}
      </button>

      <RevealOrderDetailsDialog
        order={order}
        open={revealOpen}
        onClose={() => setRevealOpen(false)}
        onConfirmedReceipt={handleConfirmedReceipt}
      />

      <ReviewDialog
        orderId={order.id}
        open={reviewOpen}
        onClose={() => setReviewOpen(false)}
        initialRating={myReview?.rating ?? 0}
        initialBody={myReview?.body ?? null}
        isEdit={hasReview}
      />
    </>
  );
}
