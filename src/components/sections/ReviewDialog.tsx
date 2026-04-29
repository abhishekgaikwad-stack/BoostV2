"use client";

import { Star, X } from "lucide-react";
import { useEffect, useRef, useState } from "react";
import { CharCounter, useCharLength } from "@/components/forms/CharCounter";
import { LISTING_LIMITS } from "@/lib/listing-limits";
import {
  submitReview,
  type SubmitReviewResult,
} from "@/lib/reviews-actions";

const REVIEW_BODY_MAX = 1500;

type Props = {
  orderId: string;
  open: boolean;
  onClose: () => void;
  initialRating?: number;
  initialBody?: string | null;
  /** Whether this is an edit of an existing review (changes copy + button label). */
  isEdit?: boolean;
};

void LISTING_LIMITS; // tree-shaking guard — keep listing-limits import explicit

export function ReviewDialog({
  orderId,
  open,
  onClose,
  initialRating = 0,
  initialBody = null,
  isEdit = false,
}: Props) {
  const [rating, setRating] = useState(initialRating);
  const [hoverRating, setHoverRating] = useState(0);
  const [pending, setPending] = useState(false);
  const [errorMessage, setErrorMessage] = useState<string | null>(null);
  const bodyRef = useRef<HTMLTextAreaElement>(null);
  const bodyLength = useCharLength(bodyRef);

  // Reset / preset on open.
  useEffect(() => {
    if (!open) return;
    setRating(initialRating);
    setHoverRating(0);
    setErrorMessage(null);
    setPending(false);
    if (bodyRef.current) {
      bodyRef.current.value = initialBody ?? "";
    }
  }, [open, initialRating, initialBody]);

  useEffect(() => {
    if (!open) return;
    function onKey(e: KeyboardEvent) {
      if (e.key === "Escape") onClose();
    }
    window.addEventListener("keydown", onKey);
    return () => window.removeEventListener("keydown", onKey);
  }, [open, onClose]);

  if (!open) return null;

  const canSubmit =
    rating >= 1 && bodyLength <= REVIEW_BODY_MAX && !pending;

  async function handleSubmit() {
    if (!canSubmit) return;
    setErrorMessage(null);
    setPending(true);
    const body = bodyRef.current?.value ?? "";
    const result: SubmitReviewResult = await submitReview({
      orderId,
      rating,
      body,
    });
    if ("error" in result) {
      setErrorMessage(result.error);
      setPending(false);
      return;
    }
    onClose();
  }

  return (
    <div
      role="dialog"
      aria-modal="true"
      aria-label="Rate your purchase"
      className="fixed inset-0 z-50 flex items-center justify-center bg-black/70 p-4"
      onClick={onClose}
    >
      <div
        className="relative w-full max-w-[480px] overflow-hidden rounded-3xl bg-[#1a1a1a] shadow-2xl"
        onClick={(e) => e.stopPropagation()}
      >
        <button
          type="button"
          onClick={onClose}
          aria-label="Close"
          className="absolute right-4 top-4 grid h-9 w-9 place-items-center rounded-full bg-[#2a2a2a] text-white transition hover:bg-[#333333]"
        >
          <X className="h-4 w-4" strokeWidth={1.75} />
        </button>

        <div className="flex flex-col gap-5 p-6">
          <h2 className="font-display text-[20px] font-medium leading-7 text-white">
            {isEdit ? "Edit your review" : "Rate your purchase"}
          </h2>

          <div className="flex flex-col gap-3">
            <div
              className="flex items-center gap-2"
              onMouseLeave={() => setHoverRating(0)}
            >
              {[1, 2, 3, 4, 5].map((value) => {
                const active = value <= (hoverRating || rating);
                return (
                  <button
                    key={value}
                    type="button"
                    aria-label={`${value} star${value === 1 ? "" : "s"}`}
                    onMouseEnter={() => setHoverRating(value)}
                    onClick={() => setRating(value)}
                    className="grid h-11 w-11 place-items-center rounded-md transition hover:bg-[#2a2a2a]"
                  >
                    <Star
                      className={`h-7 w-7 transition ${
                        active
                          ? "fill-brand-accent text-brand-accent"
                          : "text-brand-text-secondary-dark"
                      }`}
                      strokeWidth={1.5}
                    />
                  </button>
                );
              })}
            </div>
            <span className="font-display text-[12px] text-brand-text-secondary-dark">
              {rating > 0
                ? `${rating} of 5 stars`
                : "Tap a star to rate this purchase"}
            </span>
          </div>

          <label className="flex flex-col gap-2">
            <span className="font-display text-[11px] font-medium uppercase tracking-[0.06em] text-brand-text-secondary-dark">
              Review (optional)
            </span>
            <textarea
              ref={bodyRef}
              rows={5}
              defaultValue={initialBody ?? ""}
              placeholder="Tell other buyers what worked and what didn't."
              className="w-full resize-y rounded-xl bg-[#2a2a2a] px-4 py-3 font-display text-[13px] font-medium leading-5 text-white placeholder:text-brand-text-tertiary-dark focus:outline-none"
            />
            <CharCounter length={bodyLength} max={REVIEW_BODY_MAX} />
          </label>

          {errorMessage ? (
            <p className="font-display text-[12px] font-medium text-brand-discount">
              {errorMessage}
            </p>
          ) : null}

          <button
            type="button"
            onClick={handleSubmit}
            disabled={!canSubmit}
            className="mt-1 inline-flex h-11 items-center justify-center rounded-xl bg-gradient-to-b from-brand-accent to-brand-accent-dark px-5 font-display text-[13px] font-medium text-black transition hover:brightness-95 disabled:cursor-not-allowed disabled:opacity-50"
          >
            {pending
              ? isEdit
                ? "Saving…"
                : "Submitting…"
              : isEdit
                ? "Save review"
                : "Submit review"}
          </button>
        </div>
      </div>
    </div>
  );
}
