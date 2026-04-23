import { ArrowLeft, CalendarDays, Package, Star } from "lucide-react";
import Image from "next/image";
import Link from "next/link";
import { notFound } from "next/navigation";
import { SellerTabs } from "@/components/sections/SellerTabs";
import { offersForSeller } from "@/lib/offers";
import { resolveSellerProfile } from "@/lib/sellers";

function formatRegistered(iso: string) {
  const date = new Date(iso);
  if (Number.isNaN(date.getTime())) return "Registered";
  return date.toLocaleDateString(undefined, {
    month: "long",
    year: "numeric",
  });
}

export default async function SellerPage({
  params,
}: {
  params: Promise<{ storeId: string }>;
}) {
  const { storeId } = await params;
  const parsed = Number.parseInt(storeId, 10);
  if (!Number.isInteger(parsed)) notFound();

  const seller = await resolveSellerProfile(parsed);
  if (!seller) notFound();

  const { items: offers } = await offersForSeller(parsed);

  return (
    <div className="flex flex-col gap-8">
      <Link
        href="/"
        className="inline-flex w-fit items-center gap-2 rounded-xl border border-brand-border-light bg-white px-4 py-2 font-display text-[14px] font-medium text-brand-text-primary-light transition hover:bg-brand-bg-light"
      >
        <ArrowLeft className="h-4 w-4" strokeWidth={1.5} />
        Home
      </Link>

      <section className="flex flex-col gap-6 rounded-[32px] bg-black p-8 text-white">
        <header className="flex flex-wrap items-center justify-between gap-6">
          <div className="flex items-center gap-5">
            <div className="relative h-24 w-24 shrink-0">
              <div className="h-24 w-24 overflow-hidden rounded-[32px] bg-brand-bg-elevated">
                {seller.avatarUrl ? (
                  <Image
                    src={seller.avatarUrl}
                    alt={seller.name}
                    fill
                    sizes="96px"
                    className="rounded-[32px] object-cover"
                  />
                ) : null}
              </div>
              {seller.isOnline ? (
                <span
                  aria-hidden
                  className="absolute right-0 top-1 h-4 w-4 rounded-full border-2 border-black bg-brand-success"
                />
              ) : null}
            </div>
            <div className="flex flex-col gap-2">
              <span className="font-display text-[12px] font-medium leading-4 text-brand-text-secondary-dark">
                {seller.isOnline ? "Online" : "Offline"}
              </span>
              <h1 className="font-display text-[24px] font-medium leading-7">
                {seller.name}
              </h1>
              <span className="inline-flex w-fit items-center rounded-md bg-brand-bg-elevated px-2 py-0.5 font-mono text-[11px] font-medium tracking-[0.05em] text-brand-text-secondary-dark">
                STORE #{seller.storeId}
              </span>
            </div>
          </div>

          <div className="flex flex-col gap-1 rounded-2xl bg-[#161616] px-5 py-3">
            <div className="flex items-center gap-2">
              <Star
                className="h-6 w-6 text-brand-accent"
                fill="currentColor"
                strokeWidth={0}
              />
              <span className="font-display text-[24px] font-medium leading-7 tracking-[-0.01em]">
                {seller.rating.toFixed(1)} Rating
              </span>
            </div>
            <span className="font-mono text-[12px] font-medium leading-4 uppercase tracking-[0.06em] text-brand-text-secondary-dark">
              OF {seller.reviewCount.toLocaleString()} reviews
            </span>
          </div>
        </header>

        <dl className="grid grid-cols-2 gap-6 border-t border-brand-border-subtle pt-6 lg:grid-cols-3">
          <Stat
            icon={<Package className="h-5 w-5" strokeWidth={1.5} />}
            label="Products listed"
            value={seller.productCount.toString()}
          />
          <Stat
            icon={<CalendarDays className="h-5 w-5" strokeWidth={1.5} />}
            label="Registered"
            value={formatRegistered(seller.registeredAt)}
          />
          <Stat
            icon={<Star className="h-5 w-5" strokeWidth={1.5} />}
            label="Total reviews"
            value={seller.reviewCount.toLocaleString()}
          />
        </dl>
      </section>

      <SellerTabs
        offers={offers}
        reviews={seller.reviews}
        sellerName={seller.name}
      />
    </div>
  );
}

function Stat({
  icon,
  label,
  value,
}: {
  icon: React.ReactNode;
  label: string;
  value: string;
}) {
  return (
    <div className="flex items-start gap-3">
      <span className="grid h-10 w-10 place-items-center rounded-xl bg-brand-bg-elevated text-brand-accent">
        {icon}
      </span>
      <div className="flex flex-col">
        <span className="font-display text-[18px] font-medium leading-6">
          {value}
        </span>
        <span className="font-mono text-[11px] font-medium uppercase tracking-[0.06em] text-brand-text-secondary-dark">
          {label}
        </span>
      </div>
    </div>
  );
}
