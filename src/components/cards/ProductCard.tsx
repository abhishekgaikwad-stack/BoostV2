"use client";

import { Bookmark, Heart, Star, Zap } from "lucide-react";
import Link from "next/link";
import type { Account } from "@/types";
import { cn } from "@/lib/utils";

export function ProductCard({
  account,
  tone = "light",
  className,
}: {
  account: Account;
  tone?: "light" | "dark";
  className?: string;
}) {
  const isDark = tone === "dark";

  return (
    <Link
      href={`/games/${account.gameSlug}/${account.id}`}
      className={cn(
        "flex w-full flex-col gap-4 rounded-3xl border p-4 transition hover:-translate-y-0.5 hover:shadow-lg",
        isDark
          ? "border-brand-border-subtle bg-brand-bg-surface"
          : "border-brand-border-light bg-brand-bg-surface-light",
        className,
      )}
    >
      <header className="flex items-center justify-between">
        <div className="flex items-center gap-3">
          <div
            className={cn(
              "h-10 w-10 rounded-lg",
              isDark ? "bg-brand-border" : "bg-brand-bg-pill",
            )}
          />
          <div className="flex flex-col">
            <span
              className={cn(
                "font-display text-[14px] font-medium leading-4",
                isDark
                  ? "text-brand-text-primary-dark"
                  : "text-brand-text-primary-light",
              )}
            >
              {account.game}
            </span>
            <span className="font-display text-[10px] font-medium leading-3 tracking-[0.05em] text-brand-text-secondary-dark">
              {account.gameSubtitle}
            </span>
          </div>
        </div>
        <button
          type="button"
          aria-label="Save to wishlist"
          onClick={(event) => {
            event.preventDefault();
            event.stopPropagation();
          }}
          className={cn(
            "grid h-10 w-10 place-items-center rounded-lg border transition",
            isDark
              ? "border-brand-border-subtle bg-brand-bg-elevated text-brand-text-primary-dark hover:bg-brand-border"
              : "border-brand-border-light bg-white text-brand-text-primary-light hover:bg-brand-bg-pill",
          )}
        >
          <Heart className="h-5 w-5" strokeWidth={1.5} />
        </button>
      </header>

      <div
        className={cn(
          "relative aspect-[228/132] w-full rounded-2xl",
          isDark ? "bg-brand-bg-elevated" : "bg-brand-bg-pill",
        )}
      >
        <div className="absolute inset-x-3 top-3 flex items-center justify-between">
          <span className="grid h-6 w-6 place-items-center rounded-lg bg-black">
            <Zap className="h-4 w-4 text-brand-accent" fill="currentColor" />
          </span>
          <span className="grid h-6 w-6 place-items-center rounded-lg bg-black text-white">
            <Bookmark className="h-3.5 w-3.5" strokeWidth={1.5} />
          </span>
        </div>

        {(account.sellerName || account.rating !== undefined) && (
          <div className="absolute inset-x-3 bottom-3 flex h-6 items-center justify-between rounded-lg bg-black px-2 text-white">
            {account.sellerName ? (
              <span className="font-display text-[10px] font-medium leading-3 tracking-[0.05em]">
                {account.sellerName}
              </span>
            ) : null}
            {account.rating !== undefined ? (
              <span className="flex items-center gap-1">
                <Star
                  className="h-3 w-3 text-brand-accent"
                  fill="currentColor"
                  strokeWidth={0}
                />
                <span className="font-display text-[10px] font-medium leading-3 tracking-[0.05em]">
                  {account.rating.toFixed(2)}
                </span>
              </span>
            ) : null}
          </div>
        )}
      </div>

      <h3
        className={cn(
          "font-display text-[14px] font-medium leading-4 line-clamp-2",
          isDark
            ? "text-brand-text-primary-dark"
            : "text-brand-text-primary-light",
        )}
      >
        {account.title}
      </h3>

      <div className="flex flex-wrap gap-2">
        <Pill tone={tone}>{account.region}</Pill>
        <Pill tone={tone}>{account.level}</Pill>
        <Pill tone={tone}>{account.rank}</Pill>
      </div>

      <div className="flex flex-col gap-1">
        <div className="flex items-center gap-2">
          <span
            className={cn(
              "font-display text-[20px] font-medium leading-6",
              isDark
                ? "text-brand-text-primary-dark"
                : "text-brand-text-primary-light",
            )}
          >
            US${account.price.toFixed(2)}
          </span>
          {account.discount ? (
            <span className="rounded-lg bg-brand-accent px-2 py-0.5 font-display text-[12px] font-bold leading-4 text-brand-text-primary-light">
              -{account.discount}%
            </span>
          ) : null}
        </div>
        {account.oldPrice ? (
          <span
            className={cn(
              "font-display text-[12px] font-medium leading-4 line-through opacity-60",
              isDark
                ? "text-brand-text-primary-dark"
                : "text-brand-text-primary-light",
            )}
          >
            US${account.oldPrice.toFixed(2)}
          </span>
        ) : null}
      </div>
    </Link>
  );
}

function Pill({
  tone,
  children,
}: {
  tone: "light" | "dark";
  children: React.ReactNode;
}) {
  return (
    <span
      className={cn(
        "rounded-lg px-2 py-1.5 font-display text-[8px] font-medium leading-3 text-brand-text-secondary-dark",
        tone === "dark" ? "bg-brand-bg-elevated" : "bg-brand-bg-pill",
      )}
    >
      {children}
    </span>
  );
}
