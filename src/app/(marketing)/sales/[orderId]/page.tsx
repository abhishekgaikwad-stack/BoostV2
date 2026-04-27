import { ArrowLeft, Tag } from "lucide-react";
import Image from "next/image";
import Link from "next/link";
import { notFound } from "next/navigation";
import { gameImage } from "@/lib/images";
import { getMySale } from "@/lib/orders";

const paymentMethodLabel: Record<string, string> = {
  "apple-pay": "Apple Pay",
  "google-pay": "Google Pay",
  visa: "Visa",
  mastercard: "Mastercard",
  paypal: "PayPal",
};

function formatSoldAt(iso: string) {
  return new Date(iso).toLocaleString("en-GB", {
    day: "2-digit",
    month: "short",
    year: "numeric",
    hour: "2-digit",
    minute: "2-digit",
  });
}

export default async function SaleDetailPage({
  params,
}: {
  params: Promise<{ orderId: string }>;
}) {
  const { orderId } = await params;

  const sale = await getMySale(orderId);
  if (!sale) notFound();

  const offer = sale.offer;

  return (
    <div className="flex flex-col gap-8">
      <Link
        href="/user/sales"
        className="inline-flex w-fit items-center gap-2 rounded-xl border border-brand-border-light bg-white px-4 py-2 font-display text-[14px] font-medium text-brand-text-primary-light transition hover:bg-brand-bg-light"
      >
        <ArrowLeft className="h-4 w-4" strokeWidth={1.5} />
        Back to sales
      </Link>

      <div className="flex flex-col items-center gap-3 text-center">
        <span className="grid h-14 w-14 place-items-center rounded-full bg-brand-success text-black">
          <Tag className="h-7 w-7" strokeWidth={2} />
        </span>
        <h1 className="font-display text-[28px] font-medium leading-8 text-brand-text-primary-light">
          Sold
        </h1>
        <p className="font-display text-[14px] font-normal text-brand-text-secondary-light">
          This listing was purchased on{" "}
          {formatSoldAt(sale.createdAt)}.
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
              <span className="font-mono text-[11px] text-brand-text-secondary-light">
                Offer ID {offer.id}
              </span>
            </div>
          </div>
        ) : null}

        <dl className="flex flex-col gap-3 font-display text-[14px]">
          <Row label="Transaction ID" value={sale.transactionId} mono />
          <Row label="Sold on" value={formatSoldAt(sale.createdAt)} />
          <Row
            label="Payment method"
            value={paymentMethodLabel[sale.paymentMethod] ?? sale.paymentMethod}
          />
          <Row label="Status" value={sale.status} />
        </dl>

        <div className="flex items-baseline justify-between border-t border-brand-bg-pill pt-4">
          <span className="font-display text-[13px] font-medium uppercase tracking-[0.1em] text-brand-text-secondary-light">
            Sale amount
          </span>
          <span className="font-display text-[28px] font-medium leading-9 text-brand-text-primary-light">
            €{sale.price.toFixed(2)}
          </span>
        </div>
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
