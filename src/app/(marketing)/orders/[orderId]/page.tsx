import { ArrowLeft, Check, Download, Star } from "lucide-react";
import Image from "next/image";
import Link from "next/link";
import { notFound } from "next/navigation";
import { OrderActions } from "@/components/sections/OrderActions";
import { LocalDate } from "@/components/ui/LocalDate";
import { gameImage } from "@/lib/images";
import { getMyOrder } from "@/lib/orders";
import { getMyReviewForOffer, isWithinEditWindow } from "@/lib/reviews";

const paymentMethodLabel: Record<string, string> = {
  "apple-pay": "Apple Pay",
  "google-pay": "Google Pay",
  visa: "Visa",
  mastercard: "Mastercard",
  paypal: "PayPal",
};

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

  const myReview = offer ? await getMyReviewForOffer(offer.id) : null;

  return (
    <div className="flex flex-col gap-8">
      <Link
        href="/user/orders"
        className="inline-flex w-fit items-center gap-2 rounded-xl border border-brand-border-light bg-white px-4 py-2 font-display text-[14px] font-medium text-brand-text-primary-light transition hover:bg-brand-bg-light"
      >
        <ArrowLeft className="h-4 w-4" strokeWidth={1.5} />
        Back to my orders
      </Link>

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
          <Row label="Order ID" value={order.id} mono />
          <Row label="Transaction ID" value={order.transactionId} mono />
          <Row label="Date" value={<LocalDate iso={order.createdAt} />} />
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

        <OrderActions order={order} myReview={myReview} />

        <a
          href={`/api/invoice/${order.id}`}
          download={`invoice-${order.id}.pdf`}
          className="inline-flex h-12 items-center justify-center gap-2 rounded-2xl border border-brand-border-light bg-white font-display text-[14px] font-medium text-brand-text-primary-light transition hover:bg-brand-bg-light"
        >
          <Download className="h-4 w-4" strokeWidth={1.75} />
          Download invoice
        </a>

        <Link
          href={continueHref}
          className="inline-flex h-12 items-center justify-center rounded-xl bg-black font-display text-[15px] font-medium text-white transition hover:bg-neutral-800"
        >
          Continue browsing
        </Link>
      </section>

      {myReview ? (
        <section className="mx-auto flex w-full max-w-[640px] flex-col gap-3 rounded-[32px] border border-brand-bg-pill bg-white p-6">
          <div className="flex items-center justify-between gap-3">
            <span className="font-display text-[13px] font-medium uppercase tracking-[0.1em] text-brand-text-secondary-light">
              Your review
            </span>
            <span className="font-display text-[12px] text-brand-text-secondary-light">
              <LocalDate iso={myReview.updatedAt} format="date" />
              {myReview.updatedAt !== myReview.createdAt ? " (edited)" : ""}
            </span>
          </div>
          <div className="flex items-center gap-1">
            {[1, 2, 3, 4, 5].map((value) => (
              <Star
                key={value}
                className={`h-5 w-5 ${
                  value <= myReview.rating
                    ? "fill-brand-accent text-brand-accent"
                    : "text-brand-text-tertiary-dark"
                }`}
                strokeWidth={1.5}
              />
            ))}
          </div>
          {myReview.body ? (
            <p className="whitespace-pre-wrap font-display text-[14px] leading-5 text-brand-text-primary-light">
              {myReview.body}
            </p>
          ) : null}
          {!isWithinEditWindow(myReview.createdAt) ? (
            <p className="font-display text-[11px] text-brand-text-tertiary-dark">
              Reviews are locked 30 days after submission.
            </p>
          ) : null}
        </section>
      ) : null}
    </div>
  );
}

function Row({
  label,
  value,
  mono = false,
}: {
  label: string;
  value: React.ReactNode;
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
