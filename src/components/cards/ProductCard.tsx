"use client";

import { Icon } from "@iconify/react";
import { Heart } from "lucide-react";
import Image from "next/image";
import Link from "next/link";
import { useWishlist } from "@/components/wishlist/WishlistProvider";
import { gameImage } from "@/lib/images";
import { cn, discountPercent } from "@/lib/utils";
import type { Account } from "@/types";

/**
 * Product card — dark variant matching the new Figma design (frame
 * 401:2776). Used across the marketplace grids to surface a single
 * `Account`. The earlier `tone="light"` variant was retired with the
 * redesign; every grid renders the dark version now.
 *
 * Layout (top → bottom):
 *  1. Image area with bottom-fade gradient and two 32×32 notch slots
 *     (flash badge top-left, wishlist heart top-right).
 *  2. Game cover + name + "Game account" subtitle row.
 *  3. Listing title (clamped to 2 lines).
 *  4. Chip row — region + platform. Rank chip is omitted until the
 *     `accounts` table carries that field.
 *  5. Price + discount pill, struck old price below.
 *  6. "Game account" type-tag flanked by card-notch SVGs, then a thin
 *     `brand-tag-game` strip at the very bottom edge.
 */
export function ProductCard({
  account,
  className,
}: {
  account: Account;
  className?: string;
}) {
  const wishlist = useWishlist();
  const isWishlisted = wishlist?.isWishlisted(account.id) ?? false;
  const isSold = account.status !== "AVAILABLE";
  const pct = discountPercent(account.price, account.oldPrice);
  const region = account.region?.trim() || null;
  const platform = account.platform?.trim() || null;

  return (
    <div
      className={cn(
        "group flex w-full flex-col",
        isSold && "opacity-60",
        className,
      )}
    >
      <Link
        href={`/games/${account.game.slug}/${account.id}`}
        className={cn(
          "relative flex w-full flex-col overflow-hidden rounded-3xl bg-black text-white transition",
          !isSold && "group-hover:-translate-y-0.5 group-hover:shadow-lg",
        )}
      >
      {/* Image area — full bleed to the card's rounded top corners. */}
      <div className="relative aspect-[261/156] w-full">
        {account.images?.[0] ? (
          <Image
            src={account.images[0]}
            alt={account.title}
            fill
            sizes="(min-width: 1024px) 20vw, (min-width: 640px) 33vw, 100vw"
            className="object-cover"
          />
        ) : (
          <div className="absolute inset-0 bg-brand-bg-elevated" />
        )}
        {/* Bottom-fade so dark UI reads cleanly against busy artwork. */}
        <div className="pointer-events-none absolute inset-x-0 bottom-0 h-1/2 bg-gradient-to-b from-transparent to-black" />

        <div className="absolute inset-x-3 top-3 flex items-center justify-between">
          <span
            aria-hidden
            className="grid h-8 w-8 place-items-center rounded-lg bg-black"
          >
            <Icon
              icon="hugeicons:flash"
              className="h-4 w-4 text-white"
            />
          </span>
          {isSold ? (
            <span className="rounded-md bg-brand-discount px-2 py-1 font-display text-[10px] font-bold uppercase tracking-[0.1em] text-white">
              Sold out
            </span>
          ) : (
            <button
              type="button"
              aria-label={isWishlisted ? "Remove from wishlist" : "Save to wishlist"}
              aria-pressed={isWishlisted}
              onClick={(event) => {
                event.preventDefault();
                event.stopPropagation();
                wishlist?.toggle(account.id);
              }}
              className={cn(
                "grid h-8 w-8 place-items-center rounded-lg transition",
                isWishlisted
                  ? "bg-brand-discount text-white"
                  : "bg-black text-white hover:bg-brand-bg-elevated",
              )}
            >
              <Heart
                className="h-4 w-4"
                strokeWidth={1.5}
                fill={isWishlisted ? "currentColor" : "none"}
              />
            </button>
          )}
        </div>
      </div>

      {/* Body */}
      <div className="flex flex-1 flex-col gap-3 px-3 pb-0 pt-2">
        <div className="flex items-center gap-3">
          <div className="relative h-10 w-10 shrink-0 overflow-hidden rounded-lg bg-brand-bg-elevated">
            <Image
              src={gameImage(account.game.cover ?? account.game.slug)}
              alt={account.game.name}
              fill
              sizes="40px"
              className="object-cover"
            />
          </div>
          <div className="flex min-w-0 flex-col">
            <span className="truncate font-display text-[14px] font-medium leading-[18px] text-white">
              {account.game.name}
            </span>
            <span className="font-display text-[10px] font-medium leading-3 tracking-[0.05em] text-brand-text-secondary-dark">
              Game Account
            </span>
          </div>
        </div>

        <h3 className="line-clamp-2 font-display text-[14px] font-medium leading-[18px] text-white">
          {account.title}
        </h3>

        {(region || platform) && (
          <div className="flex flex-wrap items-center gap-1">
            {region ? <Chip>{region.toUpperCase()}</Chip> : null}
            {platform ? <Chip>{platform}</Chip> : null}
          </div>
        )}

        <div className="flex flex-col gap-1">
          <div className="flex items-center gap-2">
            <span className="font-display text-[20px] font-medium leading-6 text-white">
              US${account.price.toFixed(2)}
            </span>
            {pct ? (
              <span className="rounded-lg bg-brand-accent px-2 py-0.5 font-display text-[12px] font-bold leading-4 text-brand-text-primary-light">
                -{pct}%
              </span>
            ) : null}
          </div>
          {account.oldPrice ? (
            <span className="font-display text-[12px] font-medium leading-4 text-brand-text-secondary-dark line-through">
              US${account.oldPrice.toFixed(2)}
            </span>
          ) : null}
        </div>

        {/* Push the banner-tag to the bottom when the body is short. */}
        <div className="flex-1" />

        <div className="flex items-center justify-center">
          <Image
            src="/card-notch-left.svg"
            alt=""
            width={23}
            height={16}
            aria-hidden
            // Left SVG path ends at x=22.8 in its 23-wide viewBox — pull
            // the tag in by 1px so the transparent edge doesn't show as a gap.
            className="-mr-px"
          />
          <div className="flex h-4 w-[120px] items-center justify-center bg-brand-tag-game pt-1.5">
            <span className="font-display text-[10px] font-medium leading-3 text-white">
              Game account
            </span>
          </div>
          <Image
            src="/card-notch-right.svg"
            alt=""
            width={23}
            height={16}
            aria-hidden
            className="-ml-px"
          />
        </div>
      </div>
      </Link>
      {/* Bottom strip — sits BELOW the card per Figma component bounds
          (card 384h + strip 8h = 392h). Inset 32px each side so it clears
          the rounded-corner area. Tracks the card's lift on hover via the
          parent `group`. */}
      <div
        aria-hidden
        className={cn(
          "mx-8 h-2 rounded-b-[16px] bg-brand-tag-game transition",
          !isSold && "group-hover:-translate-y-0.5",
        )}
      />
    </div>
  );
}

function Chip({ children }: { children: React.ReactNode }) {
  return (
    <span className="inline-flex h-7 min-w-[40px] items-center justify-center rounded-lg bg-brand-bg-elevated px-2 font-display text-[10px] font-medium leading-3 text-white">
      {children}
    </span>
  );
}
