"use client";

import Image from "next/image";
import { Check } from "lucide-react";
import { paymentIcon } from "@/lib/images";

const methods = [
  { slug: "apple-pay", name: "Apple Pay" },
  { slug: "google-pay", name: "Google Pay" },
  { slug: "visa", name: "Visa" },
  { slug: "mastercard", name: "Mastercard" },
  { slug: "paypal", name: "PayPal" },
] as const;

export type PaymentMethodSlug = (typeof methods)[number]["slug"];

export function PaymentMethodSelector({
  value,
  onChange,
}: {
  value: PaymentMethodSlug | null;
  onChange: (slug: PaymentMethodSlug) => void;
}) {
  return (
    <section className="flex flex-col gap-5 rounded-[32px] border border-brand-bg-pill bg-white p-6">
      <h2 className="font-display text-[14px] font-medium uppercase tracking-[0.1em] text-brand-text-secondary-light">
        Payment method
      </h2>

      <div
        role="radiogroup"
        aria-label="Payment method"
        className="grid grid-cols-2 gap-3 sm:grid-cols-3 lg:grid-cols-5"
      >
        {methods.map((method) => {
          const selected = value === method.slug;
          return (
            <button
              key={method.slug}
              type="button"
              role="radio"
              aria-checked={selected}
              onClick={() => onChange(method.slug)}
              className={`relative flex flex-col items-center justify-center gap-3 rounded-2xl border bg-white px-4 py-5 transition focus:outline-none focus-visible:ring-2 focus-visible:ring-brand-accent ${
                selected
                  ? "border-brand-accent bg-brand-accent/5"
                  : "border-brand-border-light hover:border-brand-text-tertiary-dark"
              }`}
            >
              {selected ? (
                <span className="absolute right-2 top-2 grid h-5 w-5 place-items-center rounded-full bg-brand-accent text-black">
                  <Check className="h-3 w-3" strokeWidth={3} />
                </span>
              ) : null}
              <span className="relative inline-block h-8 w-[50px] overflow-hidden rounded-md">
                <Image
                  src={paymentIcon(method.slug)}
                  alt=""
                  fill
                  sizes="50px"
                  className="object-contain"
                />
              </span>
              <span className="font-display text-[12px] font-medium leading-4 text-brand-text-primary-light">
                {method.name}
              </span>
            </button>
          );
        })}
      </div>
    </section>
  );
}
