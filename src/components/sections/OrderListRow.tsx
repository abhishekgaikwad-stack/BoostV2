import Image from "next/image";
import Link from "next/link";
import { ChevronRight } from "lucide-react";
import { gameImage } from "@/lib/images";
import type { Order } from "@/lib/orders";

const paymentMethodLabel: Record<string, string> = {
  "apple-pay": "Apple Pay",
  "google-pay": "Google Pay",
  visa: "Visa",
  mastercard: "Mastercard",
  paypal: "PayPal",
};

function formatDate(iso: string) {
  return new Date(iso).toLocaleDateString("en-GB", {
    day: "2-digit",
    month: "short",
    year: "numeric",
  });
}

export function OrderListRow({
  order,
  href,
}: {
  order: Order;
  href: string;
}) {
  const offer = order.offer;
  return (
    <li>
      <Link
        href={href}
        className="flex items-center gap-4 rounded-2xl border border-brand-border-light bg-white p-4 transition hover:bg-brand-bg-light"
      >
        <div className="relative aspect-square w-16 shrink-0 overflow-hidden rounded-xl bg-brand-bg-pill">
          {offer ? (
            <Image
              src={offer.image ?? gameImage(offer.game.slug)}
              alt={offer.title}
              fill
              sizes="64px"
              className="object-cover"
            />
          ) : null}
        </div>
        <div className="flex min-w-0 flex-1 flex-col gap-1">
          <h2 className="truncate font-display text-[15px] font-medium leading-5 text-brand-text-primary-light">
            {offer?.title ?? "Listing unavailable"}
          </h2>
          <p className="font-display text-[12px] leading-4 text-brand-text-secondary-light">
            {formatDate(order.createdAt)} ·{" "}
            {paymentMethodLabel[order.paymentMethod] ?? order.paymentMethod} ·{" "}
            <span className="font-mono text-[11px]">
              {order.transactionId}
            </span>
          </p>
        </div>
        <div className="flex flex-col items-end gap-1">
          <span className="font-display text-[16px] font-medium leading-6 text-brand-text-primary-light">
            €{order.price.toFixed(2)}
          </span>
          <span className="font-display text-[10px] font-medium uppercase tracking-[0.1em] text-brand-text-secondary-light">
            {order.status}
          </span>
        </div>
        <ChevronRight
          className="h-5 w-5 text-brand-text-tertiary-dark"
          strokeWidth={1.5}
        />
      </Link>
    </li>
  );
}
