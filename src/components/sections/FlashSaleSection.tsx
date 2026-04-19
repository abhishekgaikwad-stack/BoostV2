import { ArrowRight } from "lucide-react";
import { ProductCard } from "@/components/cards/ProductCard";
import { flashSaleAccount } from "@/lib/mock";

const countdown = [
  { value: "42", label: "HOURS" },
  { value: "12", label: "MINUTES" },
  { value: "31", label: "SECONDS" },
];

export function FlashSaleSection() {
  return (
    <section className="grid gap-8 rounded-3xl bg-black p-8 lg:grid-cols-[1fr_auto] lg:items-center">
      <div className="flex flex-col gap-6">
        <span className="inline-flex items-center gap-2 font-mono text-[12px] font-medium tracking-[0.15em] text-brand-accent">
          <span className="inline-block h-2 w-2 rounded-full bg-brand-accent" />
          WEEKEND FLASH SALE
        </span>
        <h2 className="max-w-[620px] font-display text-[32px] font-medium leading-[1.1] text-brand-text-primary-dark">
          Save up to 80% on valorant accounts before the clock runs out.
        </h2>
        <p className="max-w-[620px] font-display text-[14px] font-normal leading-5 text-brand-text-secondary-dark">
          312 titles, every platform. No codes, no fine print — prices drop
          automatically at checkout.
        </p>

        <div className="flex items-center gap-3">
          {countdown.map((unit) => (
            <div
              key={unit.label}
              className="flex w-20 flex-col items-center gap-1 rounded-xl bg-brand-bg-elevated py-3"
            >
              <span className="font-display text-[28px] font-bold leading-7 text-brand-text-primary-dark">
                {unit.value}
              </span>
              <span className="font-mono text-[10px] tracking-[0.1em] text-brand-text-secondary-dark">
                {unit.label}
              </span>
            </div>
          ))}
        </div>

        <div className="flex flex-wrap items-center gap-3">
          <button
            type="button"
            className="inline-flex items-center gap-2 rounded-xl bg-gradient-to-b from-brand-accent to-brand-accent-dark px-5 py-3 font-display text-[13px] font-medium text-brand-text-primary-light transition hover:brightness-95"
          >
            Shop flash deals
          </button>
          <button
            type="button"
            className="inline-flex items-center gap-2 rounded-xl bg-brand-bg-elevated px-5 py-3 font-display text-[13px] font-medium text-brand-text-primary-dark transition hover:bg-brand-border"
          >
            View all deals
            <ArrowRight className="h-4 w-4" strokeWidth={1.5} />
          </button>
        </div>
      </div>

      <div className="w-full max-w-[288px] justify-self-end">
        <ProductCard account={flashSaleAccount} tone="dark" />
      </div>
    </section>
  );
}
