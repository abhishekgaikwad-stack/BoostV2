import { Pencil } from "lucide-react";
import Image from "next/image";
import Link from "next/link";
import { cn, discountPercent } from "@/lib/utils";

export type SellerListingRowData = {
  id: string;
  title: string;
  price: number; // cents
  oldPrice: number | null; // cents
  images: string[];
  status: "AVAILABLE" | "RESERVED" | "SOLD";
  createdAt: string;
  game: { slug: string; name: string };
};

const STATUS_TONE: Record<SellerListingRowData["status"], string> = {
  AVAILABLE: "bg-brand-success/15 text-brand-success",
  RESERVED: "bg-brand-warning/15 text-brand-warning",
  SOLD: "bg-brand-bg-pill text-brand-text-secondary-light",
};

export function SellerListingRow({
  listing,
}: {
  listing: SellerListingRowData;
}) {
  const hero = listing.images[0];
  const priceEuros = listing.price / 100;
  const oldPriceEuros = listing.oldPrice != null ? listing.oldPrice / 100 : null;
  const discount = discountPercent(priceEuros, oldPriceEuros ?? undefined);
  const createdLabel = new Date(listing.createdAt).toLocaleDateString(undefined, {
    day: "numeric",
    month: "short",
    year: "numeric",
  });

  return (
    <article className="flex items-center gap-4 rounded-2xl border border-brand-border-light bg-white p-3 transition hover:border-brand-text-secondary-light">
      <div className="relative h-20 w-20 shrink-0 overflow-hidden rounded-xl bg-brand-bg-pill">
        {hero ? (
          <Image
            src={hero}
            alt={listing.title}
            fill
            sizes="80px"
            className="object-cover"
          />
        ) : null}
      </div>

      <div className="flex min-w-0 flex-1 flex-col gap-1">
        <div className="flex flex-wrap items-center gap-2">
          <span
            className={cn(
              "inline-flex items-center rounded-md px-2 py-0.5 font-mono text-[10px] font-bold uppercase tracking-[0.06em]",
              STATUS_TONE[listing.status],
            )}
          >
            {listing.status}
          </span>
          <span className="font-display text-[11px] font-medium text-brand-text-secondary-light">
            {listing.game.name} · Listed {createdLabel}
          </span>
        </div>
        <Link
          href={`/games/${listing.game.slug}/${listing.id}`}
          className="truncate font-display text-[14px] font-medium leading-5 text-brand-text-primary-light transition hover:text-brand-text-secondary-light"
        >
          {listing.title}
        </Link>
        <div className="flex items-baseline gap-2">
          <span className="font-display text-[16px] font-medium text-brand-text-primary-light">
            €{priceEuros.toFixed(2)}
          </span>
          {oldPriceEuros != null ? (
            <span className="font-display text-[12px] font-medium text-brand-text-secondary-light line-through">
              €{oldPriceEuros.toFixed(2)}
            </span>
          ) : null}
          {discount != null ? (
            <span className="rounded-md bg-brand-accent px-1.5 py-0.5 font-display text-[10px] font-bold text-brand-text-primary-light">
              -{discount}%
            </span>
          ) : null}
        </div>
      </div>

      <Link
        href={`/user/currently-selling/${listing.id}`}
        className="inline-flex h-10 shrink-0 items-center gap-2 rounded-xl bg-black px-4 font-display text-[13px] font-medium text-white transition hover:bg-brand-bg-surface"
      >
        <Pencil className="h-4 w-4" strokeWidth={1.5} />
        Edit
      </Link>
    </article>
  );
}
