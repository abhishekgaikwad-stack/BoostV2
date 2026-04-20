"use client";

import { Icon } from "@iconify/react";
import Image from "next/image";
import { useEffect, useState } from "react";
import { createSupabaseBrowserClient } from "@/lib/supabase/client";
import { paymentIcon } from "@/lib/images";
import type { Offer } from "@/types";

const paymentMethods = [
  { slug: "apple-pay", name: "Apple Pay" },
  { slug: "google-pay", name: "Google Pay" },
  { slug: "visa", name: "Visa" },
  { slug: "mastercard", name: "Mastercard" },
  { slug: "paypal", name: "PayPal" },
];

export function BuyBox({ offer }: { offer: Offer }) {
  const [isSignedIn, setSignedIn] = useState<boolean | null>(null);
  const [pending, setPending] = useState(false);

  useEffect(() => {
    const supabase = createSupabaseBrowserClient();
    supabase.auth.getUser().then(({ data }) => {
      setSignedIn(Boolean(data.user));
    });
    const { data: sub } = supabase.auth.onAuthStateChange((_event, session) => {
      setSignedIn(Boolean(session?.user));
    });
    return () => sub.subscription.unsubscribe();
  }, []);

  async function signInWith(provider: "google" | "discord") {
    const supabase = createSupabaseBrowserClient();
    await supabase.auth.signInWithOAuth({
      provider,
      options: {
        redirectTo: `${window.location.origin}/api/auth/callback?next=${encodeURIComponent(
          window.location.pathname,
        )}`,
      },
    });
  }

  async function handleBuyNow() {
    setPending(true);
    // TODO: create Stripe Checkout Session via /api/checkout → redirect
    window.alert("Checkout coming soon.");
    setPending(false);
  }

  return (
    <aside className="sticky top-[calc(var(--spacing)*12)] flex w-full flex-col gap-4 self-start rounded-3xl bg-black p-6 text-white">
      {offer.discount ? (
        <div className="flex items-center gap-3 font-mono text-[11px] tracking-[0.1em] text-brand-text-secondary-dark">
          <span className="rounded-md bg-brand-accent px-2 py-1 font-display text-[11px] font-bold text-black">
            -{offer.discount}%
          </span>
          <span className="uppercase text-brand-accent">
            {offer.offerEndsLabel ?? "Limited offer"}
          </span>
        </div>
      ) : null}

      <div className="flex items-baseline gap-3">
        <span className="font-display text-[32px] font-medium leading-9">
          €{offer.price.toFixed(2)}
        </span>
        {offer.oldPrice ? (
          <span className="font-display text-[14px] font-medium text-brand-text-secondary-dark line-through">
            €{offer.oldPrice.toFixed(2)}
          </span>
        ) : null}
      </div>

      {isSignedIn === false ? (
        <div className="flex items-center gap-3 rounded-2xl border border-brand-border-subtle bg-brand-bg-elevated px-4 py-3">
          <span className="flex-1 font-display text-[13px] font-medium text-brand-text-secondary-dark">
            login with
          </span>
          <button
            type="button"
            onClick={() => signInWith("google")}
            aria-label="Login with Google"
            className="grid h-9 w-9 place-items-center rounded-full bg-white"
          >
            <GoogleMark />
          </button>
          <button
            type="button"
            onClick={() => signInWith("discord")}
            aria-label="Login with Discord"
            className="grid h-9 w-9 place-items-center rounded-full bg-[#5865F2]"
          >
            <DiscordMark />
          </button>
        </div>
      ) : null}

      <button
        type="button"
        onClick={handleBuyNow}
        disabled={pending || isSignedIn === null}
        className="inline-flex h-12 items-center justify-center rounded-2xl bg-gradient-to-b from-brand-accent to-brand-accent-dark font-display text-[15px] font-medium text-black transition hover:brightness-95 disabled:opacity-60"
      >
        {pending ? "Loading…" : "Buy Now"}
      </button>

      <ul className="grid grid-cols-2 gap-3 text-brand-text-secondary-dark [&>li]:justify-center [&>li:last-child]:col-span-2">
        <TrustItem icon="hugeicons:shield-02" label="14 Days Warranty" />
        <TrustItem icon="hugeicons:flash" label="Instant Delivery" />
        <TrustItem icon="hugeicons:question" label="24/7 Human Support" />
      </ul>

      <label className="flex items-center gap-2 font-display text-[12px] font-medium text-brand-text-secondary-dark">
        <input
          type="checkbox"
          className="h-5 w-5 appearance-none rounded border border-brand-border-subtle bg-brand-bg-elevated checked:bg-brand-accent checked:bg-[url('data:image/svg+xml;utf8,%3Csvg%20xmlns%3D%22http%3A%2F%2Fwww.w3.org%2F2000%2Fsvg%22%20viewBox%3D%220%200%2012%2010%22%3E%3Cpath%20fill%3D%22none%22%20stroke%3D%22black%22%20stroke-width%3D%222%22%20stroke-linecap%3D%22round%22%20stroke-linejoin%3D%22round%22%20d%3D%22M1%205l4%204l6-8%22%2F%3E%3C%2Fsvg%3E')] checked:bg-[length:12px_12px] checked:bg-center checked:bg-no-repeat"
        />
        Email me with news and offers
      </label>

      <div className="flex items-center justify-between border-t border-brand-border-subtle pt-3">
        {paymentMethods.map((method) => (
          <span
            key={method.slug}
            className="relative inline-block h-7 w-11 overflow-hidden rounded-md bg-brand-bg-elevated"
          >
            <Image
              src={paymentIcon(method.slug)}
              alt={method.name}
              fill
              sizes="44px"
              className="object-contain"
            />
          </span>
        ))}
      </div>
    </aside>
  );
}

function TrustItem({ icon, label }: { icon: string; label: string }) {
  return (
    <li className="flex items-center gap-2">
      <Icon icon={icon} className="h-6 w-6 text-brand-accent" />
      <span className="font-display text-[12px] font-normal leading-4 text-brand-text-primary-dark">
        {label}
      </span>
    </li>
  );
}

function GoogleMark() {
  return (
    <svg viewBox="0 0 24 24" className="h-5 w-5" aria-hidden>
      <path
        fill="#4285F4"
        d="M23.49 12.27c0-.79-.07-1.54-.19-2.27H12v4.51h6.44c-.28 1.43-1.11 2.64-2.35 3.46v2.88h3.79c2.22-2.05 3.61-5.08 3.61-8.58z"
      />
      <path
        fill="#34A853"
        d="M12 24c3.24 0 5.95-1.08 7.93-2.91l-3.79-2.88c-1.05.7-2.39 1.12-4.14 1.12-3.18 0-5.88-2.15-6.84-5.04H1.23v3.16C3.2 21.31 7.3 24 12 24z"
      />
      <path
        fill="#FBBC05"
        d="M5.16 14.29a7.22 7.22 0 010-4.58V6.55H1.23a12 12 0 000 10.9l3.93-3.16z"
      />
      <path
        fill="#EA4335"
        d="M12 4.75c1.77 0 3.36.61 4.61 1.8l3.46-3.46C17.95 1.19 15.24 0 12 0 7.3 0 3.2 2.69 1.23 6.55l3.93 3.16C6.12 6.9 8.82 4.75 12 4.75z"
      />
    </svg>
  );
}

function DiscordMark() {
  return (
    <svg viewBox="0 0 24 24" className="h-4 w-4 text-white" aria-hidden>
      <path
        fill="currentColor"
        d="M20.317 4.369A19.79 19.79 0 0015.432 2.854a.074.074 0 00-.079.037c-.21.375-.445.865-.608 1.25a18.27 18.27 0 00-5.487 0 12.65 12.65 0 00-.618-1.25.077.077 0 00-.078-.037A19.74 19.74 0 003.677 4.37a.07.07 0 00-.032.027C.533 9.046-.32 13.58.099 18.058a.082.082 0 00.031.056 19.9 19.9 0 005.993 3.03.078.078 0 00.084-.028c.462-.63.873-1.295 1.226-1.994a.076.076 0 00-.042-.106 13.1 13.1 0 01-1.872-.892.077.077 0 01-.008-.128c.126-.094.252-.192.372-.291a.074.074 0 01.078-.011c3.928 1.793 8.18 1.793 12.062 0a.074.074 0 01.078.01c.12.099.247.198.374.292a.077.077 0 01-.006.128c-.598.349-1.22.643-1.873.891a.076.076 0 00-.041.107c.36.698.772 1.362 1.225 1.993a.076.076 0 00.084.028 19.84 19.84 0 006.002-3.03.077.077 0 00.031-.055c.5-5.177-.838-9.674-3.549-13.66a.061.061 0 00-.031-.028zM8.02 15.331c-1.183 0-2.157-1.085-2.157-2.419s.956-2.419 2.157-2.419c1.21 0 2.176 1.095 2.157 2.42 0 1.333-.956 2.418-2.157 2.418zm7.975 0c-1.183 0-2.157-1.085-2.157-2.419s.955-2.419 2.157-2.419c1.21 0 2.176 1.095 2.157 2.42 0 1.333-.947 2.418-2.157 2.418z"
      />
    </svg>
  );
}
