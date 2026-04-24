"use client";

import { ArrowLeft, Heart } from "lucide-react";
import Link from "next/link";
import { useEffect } from "react";
import { useAuthPrompt } from "@/components/auth/AuthPromptProvider";

/**
 * Shown on `/wishlist` for anonymous users. Auto-opens the login popup once on
 * mount — the user navigated here deliberately, so the login step is expected.
 * The inline CTA lets them re-trigger it if they dismiss the popup.
 */
export function WishlistSignInPrompt() {
  const { requireLogin } = useAuthPrompt();

  useEffect(() => {
    requireLogin();
  }, [requireLogin]);

  return (
    <div className="flex flex-col gap-8">
      <Link
        href="/"
        className="inline-flex w-fit items-center gap-2 rounded-xl border border-brand-border-light bg-white px-4 py-2 font-display text-[14px] font-medium text-brand-text-primary-light transition hover:bg-brand-bg-light"
      >
        <ArrowLeft className="h-4 w-4" strokeWidth={1.5} />
        Home
      </Link>

      <h1 className="font-display text-[28px] font-medium leading-8 text-brand-text-primary-light">
        Wishlist
      </h1>

      <div className="flex flex-col items-center gap-4 rounded-3xl border border-brand-border-light bg-brand-bg-light p-10 text-center">
        <span className="grid h-12 w-12 place-items-center rounded-2xl bg-white text-brand-discount">
          <Heart className="h-6 w-6" strokeWidth={1.5} />
        </span>
        <p className="font-display text-[14px] font-medium text-brand-text-secondary-light">
          Sign in to see the listings you&rsquo;ve saved.
        </p>
        <button
          type="button"
          onClick={requireLogin}
          className="inline-flex h-11 items-center justify-center rounded-2xl bg-gradient-to-b from-brand-accent to-brand-accent-dark px-6 font-display text-[14px] font-medium text-brand-text-primary-light transition hover:brightness-95"
        >
          Sign in
        </button>
      </div>
    </div>
  );
}
