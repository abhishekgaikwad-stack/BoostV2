import { ChevronRight } from "lucide-react";
import Image from "next/image";
import Link from "next/link";
import { LocalDate } from "@/components/ui/LocalDate";
import { gameImage } from "@/lib/images";
import type { Order, OrderStatus } from "@/lib/orders";

const statusTone: Record<OrderStatus, string> = {
  PENDING: "bg-brand-bg-pill text-brand-text-secondary-light",
  PAID: "bg-brand-success/20 text-brand-success",
  DELIVERED: "bg-brand-accent text-black",
  REFUNDED: "bg-brand-discount/15 text-brand-discount",
};

/**
 * Buyer-facing order card for /user/orders. Lays out the spec fields
 * explicitly (game image, amount, placed-on, order id, status) with an
 * obvious "View order details" CTA on the right.
 */
export function OrderCard({ order }: { order: Order }) {
  const offer = order.offer;
  const gameSlug = offer?.game.slug ?? "";
  const detailsHref = `/orders/${order.id}`;

  return (
    <li className="flex flex-col gap-4 rounded-3xl border border-brand-border-light bg-white p-5 sm:flex-row sm:items-center">
      <div className="relative aspect-square w-20 shrink-0 overflow-hidden rounded-2xl bg-brand-bg-pill">
        {gameSlug ? (
          <Image
            src={gameImage(gameSlug)}
            alt={offer?.game.name ?? "Game cover"}
            fill
            sizes="80px"
            className="object-cover"
          />
        ) : null}
      </div>

      <div className="flex min-w-0 flex-1 flex-col gap-2">
        <div className="flex flex-wrap items-center gap-2">
          <span className="font-display text-[11px] font-medium uppercase tracking-[0.1em] text-brand-text-secondary-light">
            Order ID
          </span>
          <span className="truncate font-mono text-[13px] text-brand-text-primary-light">
            {order.transactionId}
          </span>
          <span
            className={`rounded-md px-2 py-0.5 font-display text-[10px] font-bold uppercase tracking-[0.1em] ${statusTone[order.status]}`}
          >
            {order.status}
          </span>
        </div>
        <p className="font-display text-[12px] leading-4 text-brand-text-secondary-light">
          Placed on{" "}
          <LocalDate iso={order.createdAt} />
        </p>
        {offer ? (
          <p className="truncate font-display text-[14px] font-medium leading-5 text-brand-text-primary-light">
            {offer.game.name} · {offer.title}
          </p>
        ) : null}
      </div>

      <div className="flex items-center justify-between gap-4 sm:flex-col sm:items-end sm:justify-center">
        <span className="font-display text-[20px] font-medium leading-7 text-brand-text-primary-light">
          €{order.price.toFixed(2)}
        </span>
        <Link
          href={detailsHref}
          className="inline-flex h-10 items-center gap-1 rounded-2xl bg-gradient-to-b from-brand-accent to-brand-accent-dark px-4 font-display text-[13px] font-medium text-brand-text-primary-light transition hover:brightness-95"
        >
          View order details
          <ChevronRight className="h-4 w-4" strokeWidth={1.5} />
        </Link>
      </div>
    </li>
  );
}
