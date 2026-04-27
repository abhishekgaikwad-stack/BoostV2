"use client";

import Image from "next/image";
import { useState } from "react";
import { CheckoutSummary } from "@/components/sections/CheckoutSummary";
import {
  PaymentMethodSelector,
  type PaymentMethodSlug,
} from "@/components/sections/PaymentMethodSelector";
import { gameImage } from "@/lib/images";
import type { Account } from "@/types";

export function CheckoutBoard({ offer }: { offer: Account }) {
  const [selectedMethod, setSelectedMethod] =
    useState<PaymentMethodSlug | null>(null);

  const hero = offer.images?.[0];

  return (
    <div className="grid gap-6 lg:grid-cols-[1fr_400px]">
      <div className="flex flex-col gap-6">
        <section className="flex flex-col gap-6 rounded-[32px] border border-brand-bg-pill bg-white p-6">
          <h2 className="font-display text-[14px] font-medium uppercase tracking-[0.1em] text-brand-text-secondary-light">
            Your order
          </h2>

          <div className="flex gap-4">
            <div className="relative aspect-square w-28 shrink-0 overflow-hidden rounded-2xl bg-brand-bg-pill">
              {hero ? (
                <Image
                  src={hero}
                  alt={offer.title}
                  fill
                  sizes="112px"
                  className="object-cover"
                  priority
                />
              ) : (
                <Image
                  src={gameImage(offer.game.slug)}
                  alt={offer.game.name}
                  fill
                  sizes="112px"
                  className="object-cover"
                />
              )}
            </div>
            <div className="flex min-w-0 flex-1 flex-col gap-2">
              <span className="w-fit rounded-full bg-brand-bg-pill px-3 py-1 font-display text-[12px] font-medium text-brand-text-primary-light">
                {offer.game.name}
              </span>
              <h3 className="font-display text-[18px] font-medium leading-6 text-brand-text-primary-light">
                {offer.title}
              </h3>
              <span className="font-display text-[12px] font-medium text-brand-text-secondary-light">
                Sold by {offer.seller.name}
              </span>
            </div>
            <div className="flex flex-col items-end gap-1">
              <span className="font-display text-[18px] font-medium leading-6 text-brand-text-primary-light">
                €{offer.price.toFixed(2)}
              </span>
              {offer.oldPrice ? (
                <span className="font-display text-[13px] font-medium text-brand-text-tertiary-dark line-through">
                  €{offer.oldPrice.toFixed(2)}
                </span>
              ) : null}
            </div>
          </div>
        </section>

        <PaymentMethodSelector
          value={selectedMethod}
          onChange={setSelectedMethod}
        />
      </div>

      <CheckoutSummary offer={offer} selectedMethod={selectedMethod} />
    </div>
  );
}
