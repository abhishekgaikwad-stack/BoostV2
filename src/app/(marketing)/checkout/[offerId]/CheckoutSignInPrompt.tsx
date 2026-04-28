"use client";

import { ArrowLeft, Lock } from "lucide-react";
import Link from "next/link";
import { useEffect } from "react";
import { useAuthPrompt } from "@/components/auth/AuthPromptProvider";

/**
 * Shown on `/checkout/[offerId]` for anonymous users. Auto-opens the login
 * popup once on mount — the user clicked Buy Now or pasted the URL, so the
 * login step is expected. Inline button re-triggers if they dismiss the popup.
 */
export function CheckoutSignInPrompt({ backHref }: { backHref: string }) {
  const { requireLogin } = useAuthPrompt();

  useEffect(() => {
    requireLogin();
  }, [requireLogin]);

  return (
    <div className="flex flex-col gap-8">
      <Link
        href={backHref}
        className="inline-flex w-fit items-center gap-2 rounded-xl border border-brand-border-light bg-white px-4 py-2 font-display text-[14px] font-medium text-brand-text-primary-light transition hover:bg-brand-bg-light"
      >
        <ArrowLeft className="h-4 w-4" strokeWidth={1.5} />
        Back
      </Link>

      <h1 className="font-display text-[28px] font-medium leading-8 text-brand-text-primary-light">
        Checkout
      </h1>

      <div className="flex flex-col items-center gap-4 rounded-3xl border border-brand-border-light bg-brand-bg-light p-10 text-center">
        <span className="grid h-12 w-12 place-items-center rounded-2xl bg-white text-brand-text-primary-light">
          <Lock className="h-6 w-6" strokeWidth={1.5} />
        </span>
        <p className="font-display text-[14px] font-medium text-brand-text-secondary-light">
          Sign in to complete your purchase.
        </p>
        <button
          type="button"
          onClick={requireLogin}
          className="inline-flex h-11 items-center justify-center rounded-xl bg-black px-6 font-display text-[14px] font-medium text-white transition hover:bg-neutral-800"
        >
          Sign in
        </button>
      </div>
    </div>
  );
}
