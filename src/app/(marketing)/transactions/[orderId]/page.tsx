import { Check } from "lucide-react";
import Image from "next/image";
import Link from "next/link";
import { notFound } from "next/navigation";
import { gameImage } from "@/lib/images";
import { getMyOrder } from "@/lib/orders";

const paymentMethodLabel: Record<string, string> = {
  "apple-pay": "Apple Pay",
  "google-pay": "Google Pay",
  visa: "Visa",
  mastercard: "Mastercard",
  paypal: "PayPal",
};

function formatOrderDate(iso: string) {
  return new Date(iso).toLocaleString("en-GB", {
    day: "2-digit",
    month: "short",
    year: "numeric",
    hour: "2-digit",
    minute: "2-digit",
  });
}

export default async function OrderSuccessPage({
  params,
}: {
  params: Promise<{ orderId: string }>;
}) {
  const { orderId } = await params;

  const order = await getMyOrder(orderId);
  if (!order) notFound();

  const offer = order.offer;
  const continueHref = offer ? `/games/${offer.game.slug}` : "/";

  return (
    <div className="flex flex-col gap-8">
      <div className="flex flex-col items-center gap-3 text-center">
        <span className="grid h-14 w-14 place-items-center rounded-full bg-brand-success text-black">
          <Check className="h-7 w-7" strokeWidth={3} />
        </span>
        <h1 className="font-display text-[28px] font-medium leading-8 text-brand-text-primary-light">
          Payment successful
        </h1>
        <p className="font-display text-[14px] font-normal text-brand-text-secondary-light">
          Your order has been placed. A receipt has been generated below.
        </p>
      </div>

      <section className="mx-auto flex w-full max-w-[640px] flex-col gap-6 rounded-[32px] border border-brand-bg-pill bg-white p-6">
        {offer ? (
          <div className="flex gap-4 border-b border-brand-bg-pill pb-6">
            <div className="relative aspect-square w-20 shrink-0 overflow-hidden rounded-2xl bg-brand-bg-pill">
              <Image
                src={offer.image ?? gameImage(offer.game.slug)}
                alt={offer.title}
                fill
                sizes="80px"
                className="object-cover"
              />
            </div>
            <div className="flex min-w-0 flex-1 flex-col gap-2">
              <span className="w-fit rounded-full bg-brand-bg-pill px-3 py-1 font-display text-[12px] font-medium text-brand-text-primary-light">
                {offer.game.name}
              </span>
              <h2 className="font-display text-[16px] font-medium leading-5 text-brand-text-primary-light">
                {offer.title}
              </h2>
            </div>
          </div>
        ) : null}

        <dl className="flex flex-col gap-3 font-display text-[14px]">
          <Row label="Transaction ID" value={order.transactionId} mono />
          <Row label="Date" value={formatOrderDate(order.createdAt)} />
          <Row
            label="Payment method"
            value={paymentMethodLabel[order.paymentMethod] ?? order.paymentMethod}
          />
          <Row label="Status" value={order.status} />
        </dl>

        <div className="flex items-baseline justify-between border-t border-brand-bg-pill pt-4">
          <span className="font-display text-[13px] font-medium uppercase tracking-[0.1em] text-brand-text-secondary-light">
            Total paid
          </span>
          <span className="font-display text-[28px] font-medium leading-9 text-brand-text-primary-light">
            €{order.price.toFixed(2)}
          </span>
        </div>

        <Link
          href={continueHref}
          className="inline-flex h-12 items-center justify-center rounded-2xl bg-gradient-to-b from-brand-accent to-brand-accent-dark font-display text-[15px] font-medium text-brand-text-primary-light transition hover:brightness-95"
        >
          Continue browsing
        </Link>
      </section>
    </div>
  );
}

function Row({
  label,
  value,
  mono = false,
}: {
  label: string;
  value: string;
  mono?: boolean;
}) {
  return (
    <div className="flex items-baseline justify-between gap-4">
      <dt className="text-brand-text-secondary-light">{label}</dt>
      <dd
        className={`min-w-0 truncate text-right font-medium text-brand-text-primary-light ${
          mono ? "font-mono text-[13px]" : ""
        }`}
      >
        {value}
      </dd>
    </div>
  );
}
