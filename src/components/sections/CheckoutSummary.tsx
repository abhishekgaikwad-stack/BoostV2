"use client";

import { useState } from "react";
import type { PaymentMethodSlug } from "@/components/sections/PaymentMethodSelector";
import type { Account } from "@/types";

export function CheckoutSummary({
  offer,
  selectedMethod,
}: {
  offer: Account;
  selectedMethod: PaymentMethodSlug | null;
}) {
  const [pending, setPending] = useState(false);

  const savings =
    offer.oldPrice && offer.oldPrice > offer.price
      ? offer.oldPrice - offer.price
      : 0;

  async function handleProceedToPay() {
    if (!selectedMethod) return;
    setPending(true);
    // TODO: replace stub with real payment flow.
    //   1. POST /api/checkout → create Stripe Checkout Session for `offer.id`
    //      with `payment_method_types: [selectedMethod]` for the authed user;
    //      insert a PENDING row into `public.orders`.
    //   2. Redirect to `session.url`.
    //   3. /api/stripe/webhook flips the order to PAID on `checkout.session.completed`.
    // Requires migration `0006_orders.sql` and Stripe key wiring.
    await new Promise((r) => setTimeout(r, 400));
    window.alert("Payment integration coming soon.");
    setPending(false);
  }

  return (
    <aside className="sticky top-[calc(var(--spacing)*12)] flex w-full flex-col gap-5 self-start rounded-3xl bg-black p-6 text-white">
      <h2 className="font-display text-[14px] font-medium uppercase tracking-[0.1em] text-brand-text-secondary-dark">
        Order summary
      </h2>

      <dl className="flex flex-col gap-3 font-display text-[14px] text-brand-text-primary-dark">
        <div className="flex items-baseline justify-between">
          <dt className="text-brand-text-secondary-dark">Subtotal</dt>
          <dd className="font-medium">€{offer.price.toFixed(2)}</dd>
        </div>
        {savings > 0 ? (
          <div className="flex items-baseline justify-between text-brand-accent">
            <dt>You save</dt>
            <dd className="font-medium">−€{savings.toFixed(2)}</dd>
          </div>
        ) : null}
      </dl>

      <div className="flex items-baseline justify-between border-t border-brand-border-subtle pt-4">
        <span className="font-display text-[13px] font-medium uppercase tracking-[0.1em] text-brand-text-secondary-dark">
          Total
        </span>
        <div className="flex items-baseline gap-3">
          {offer.oldPrice ? (
            <span className="font-display text-[14px] font-medium text-brand-text-secondary-dark line-through">
              €{offer.oldPrice.toFixed(2)}
            </span>
          ) : null}
          <span className="font-display text-[32px] font-medium leading-9">
            €{offer.price.toFixed(2)}
          </span>
        </div>
      </div>

      <button
        type="button"
        onClick={handleProceedToPay}
        disabled={pending || !selectedMethod}
        className="inline-flex h-12 items-center justify-center rounded-2xl bg-gradient-to-b from-brand-accent to-brand-accent-dark font-display text-[15px] font-medium text-black transition hover:brightness-95 disabled:cursor-not-allowed disabled:opacity-60"
      >
        {pending ? "Loading…" : "Proceed to Pay"}
      </button>

      {!selectedMethod ? (
        <p className="text-center font-display text-[12px] font-normal text-brand-text-secondary-dark">
          Select a payment method to continue
        </p>
      ) : null}
    </aside>
  );
}
