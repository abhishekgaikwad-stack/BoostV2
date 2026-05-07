"use client";

import { Check } from "lucide-react";
import Image from "next/image";
import { useEffect, useRef, useState } from "react";
import { createPortal } from "react-dom";
import {
  PROTECT_PLAN_LABELS,
  type ProtectPlan,
  protectFeeEuro,
} from "@/lib/protect";
import { cn } from "@/lib/utils";

type Props = {
  open: boolean;
  /** Effective listing price in euros — already discounted if a flash sale is active. */
  priceEuro: number;
  onClose: () => void;
  /** Receives the chosen plan, or `null` if the buyer skipped protect. */
  onConfirm: (plan: ProtectPlan | null) => void;
};

const PLANS: ProtectPlan[] = ["3m", "6m"];

/**
 * Pre-checkout popup that pitches the extended-warranty add-on. Default
 * selection mirrors the Figma (3M) so a single click ships the buyer to
 * checkout with protect attached. "Skip" sends them onward with no plan.
 */
export function BoostProtectModal({ open, priceEuro, onClose, onConfirm }: Props) {
  const [selected, setSelected] = useState<ProtectPlan>("3m");
  const addBtnRef = useRef<HTMLButtonElement | null>(null);

  useEffect(() => {
    if (!open) return;

    function onKey(event: KeyboardEvent) {
      if (event.key === "Escape") onClose();
    }
    document.addEventListener("keydown", onKey);
    document.body.style.overflow = "hidden";
    addBtnRef.current?.focus();
    return () => {
      document.removeEventListener("keydown", onKey);
      document.body.style.overflow = "";
    };
  }, [open, onClose]);

  // `open` is false until a user click on the client (BuyBox is "use client"),
  // so SSR always returns null here and `document` is safe to reference below.
  if (!open) return null;

  // Portal to body so the modal escapes the BuyBox's sticky stacking context
  // and reliably covers the sticky page header (z-20).
  return createPortal(
    <div
      role="dialog"
      aria-modal="true"
      aria-labelledby="boost-protect-title"
      onClick={onClose}
      className="fixed inset-0 z-[70] flex items-center justify-center bg-black/50 p-4 backdrop-blur-[4px]"
    >
      <div
        onClick={(event) => event.stopPropagation()}
        className="relative w-full max-w-[455px] rounded-[32px] bg-black p-6 text-white shadow-2xl"
      >
        <div className="absolute -top-14 left-1/2 -translate-x-1/2">
          <Image
            src="/boost-protect-shield.svg"
            alt="Boost Protect"
            width={113}
            height={113}
            priority
          />
        </div>

        <div className="mt-14 flex flex-col gap-2">
          <h2
            id="boost-protect-title"
            className="font-display text-[24px] font-medium leading-7 text-white"
          >
            Feel safe with boost protect
          </h2>
          <p className="font-display text-[12px] font-normal leading-4 text-brand-text-secondary-dark">
            Activate Driffle boost extended warranty for additional protection
            and peace of mind.
          </p>
        </div>

        <div className="mt-6 flex items-center justify-between font-display text-[10px] font-medium uppercase tracking-[0.05em] text-brand-text-secondary-dark">
          <span>Select duration:</span>
          <a
            href="#"
            className="transition hover:text-white"
            aria-label="Learn how Boost Protect works"
            onClick={(event) => event.preventDefault()}
          >
            How does it work?
          </a>
        </div>

        <div className="mt-3 grid grid-cols-2 gap-2">
          {PLANS.map((plan) => {
            const fee = protectFeeEuro(priceEuro, plan);
            const isActive = selected === plan;
            return (
              <button
                key={plan}
                type="button"
                onClick={() => setSelected(plan)}
                aria-pressed={isActive}
                className={cn(
                  "relative flex h-[78px] flex-col justify-center rounded-2xl bg-brand-bg-elevated px-4 text-left transition",
                  isActive
                    ? "border border-brand-protect"
                    : "border border-transparent hover:border-brand-border-subtle",
                )}
              >
                <span className="font-display text-[16px] font-medium leading-5 text-brand-protect">
                  {PROTECT_PLAN_LABELS[plan]}
                </span>
                <span className="mt-1 font-display text-[14px] font-medium leading-[18px] text-white">
                  €{fee.toFixed(2)}
                </span>
                <span
                  aria-hidden
                  className={cn(
                    "absolute right-3 top-3 grid h-5 w-5 place-items-center rounded-full transition",
                    isActive
                      ? "bg-brand-protect"
                      : "border border-brand-border-subtle bg-transparent",
                  )}
                >
                  {isActive ? (
                    <Check
                      className="h-3 w-3 text-brand-text-primary-light"
                      strokeWidth={4}
                    />
                  ) : null}
                </span>
              </button>
            );
          })}
        </div>

        <button
          ref={addBtnRef}
          type="button"
          onClick={() => onConfirm(selected)}
          className="mt-5 inline-flex h-[52px] w-full items-center justify-center rounded-2xl bg-brand-protect font-display text-[16px] font-medium text-brand-text-primary-light transition hover:brightness-95"
        >
          Add protect
        </button>

        <button
          type="button"
          onClick={() => onConfirm(null)}
          className="mt-3 inline-flex w-full items-center justify-center font-display text-[16px] font-medium text-brand-text-secondary-dark transition hover:text-white"
        >
          Skip
        </button>
      </div>
    </div>,
    document.body,
  );
}
