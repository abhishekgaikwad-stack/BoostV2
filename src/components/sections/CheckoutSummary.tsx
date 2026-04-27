"use client";

import { useRouter } from "next/navigation";
import { useState } from "react";
import type { PaymentMethodSlug } from "@/components/sections/PaymentMethodSelector";
import { placeOrder } from "@/lib/orders-actions";
import type { Account } from "@/types";

export function CheckoutSummary({
  offer,
  selectedMethod,
}: {
  offer: Account;
  selectedMethod: PaymentMethodSlug | null;
}) {
  const router = useRouter();
  const [pending, setPending] = useState(false);
  const [error, setError] = useState<string | null>(null);

  const savings =
    offer.oldPrice && offer.oldPrice > offer.price
      ? offer.oldPrice - offer.price
      : 0;

  async function handleProceedToPay() {
    if (!selectedMethod) return;
    setError(null);
    setPending(true);
    const result = await placeOrder({
      offerId: offer.id,
      paymentMethod: selectedMethod,
    });
    if ("error" in result) {
      setError(result.error);
      setPending(false);
      return;
    }
    router.push(`/transactions/${result.orderId}`);
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
        {pending ? "Placing order…" : "Proceed to Pay"}
      </button>

      {error ? (
        <p className="text-center font-display text-[12px] font-normal text-brand-discount">
          {error}
        </p>
      ) : !selectedMethod ? (
        <p className="text-center font-display text-[12px] font-normal text-brand-text-secondary-dark">
          Select a payment method to continue
        </p>
      ) : null}
    </aside>
  );
}
