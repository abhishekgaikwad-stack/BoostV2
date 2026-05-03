import {
  SELLER_COMMISSION_RATE,
  commissionCents,
  payoutCents,
} from "@/lib/commission";

/**
 * Live preview of the seller's payout net of commission. Always renders
 * so the seller can see the contract up front; shows a placeholder when
 * no price has been typed yet.
 */
export function CommissionBreakdown({ priceEur }: { priceEur: number }) {
  const ratePct = (SELLER_COMMISSION_RATE * 100).toFixed(0);
  const hasPrice = Number.isFinite(priceEur) && priceEur > 0;

  if (!hasPrice) {
    return (
      <div className="rounded-2xl border border-brand-border-light bg-brand-bg-light p-4">
        <p className="font-display text-[12px] leading-5 text-brand-text-secondary-light">
          Enter a selling price to preview your {ratePct}% platform
          commission and payout.
        </p>
      </div>
    );
  }

  const priceCents = Math.round(priceEur * 100);
  const commission = commissionCents(priceCents) / 100;
  const payout = payoutCents(priceCents) / 100;

  return (
    <div className="flex flex-col gap-2 rounded-2xl border border-brand-border-light bg-brand-bg-light p-4">
      <Row label="Selling price" value={`€${priceEur.toFixed(2)}`} />
      <Row
        label={`Platform commission (${ratePct}%)`}
        value={`−€${commission.toFixed(2)}`}
        tone="discount"
      />
      <div className="my-1 border-t border-brand-border-light" />
      <Row
        label="You receive"
        value={`€${payout.toFixed(2)}`}
        tone="emphasis"
      />
    </div>
  );
}

function Row({
  label,
  value,
  tone = "default",
}: {
  label: string;
  value: string;
  tone?: "default" | "discount" | "emphasis";
}) {
  const labelClass =
    tone === "emphasis"
      ? "font-display text-[13px] font-medium text-brand-text-primary-light"
      : "font-display text-[12px] text-brand-text-secondary-light";
  const valueClass =
    tone === "discount"
      ? "font-display text-[13px] font-medium text-brand-discount"
      : tone === "emphasis"
        ? "font-display text-[16px] font-medium text-brand-text-primary-light"
        : "font-display text-[13px] font-medium text-brand-text-primary-light";

  return (
    <div className="flex items-baseline justify-between gap-3">
      <span className={labelClass}>{label}</span>
      <span className={valueClass}>{value}</span>
    </div>
  );
}
