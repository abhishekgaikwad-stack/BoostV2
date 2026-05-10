"use client";

import { ChevronDown, Search, X } from "lucide-react";
import { useRouter, useSearchParams } from "next/navigation";
import { useCallback, useEffect, useMemo, useRef, useState } from "react";
import { ProductCard } from "@/components/cards/ProductCard";
import { cn } from "@/lib/utils";
import type { Account } from "@/types";

type SortValue = "newest" | "price-asc" | "price-desc" | "discount-desc";

const SORT_OPTIONS: ReadonlyArray<{ value: SortValue; label: string }> = [
  { value: "newest", label: "Newest" },
  { value: "price-asc", label: "Price: low to high" },
  { value: "price-desc", label: "Price: high to low" },
  { value: "discount-desc", label: "Highest discount" },
];

const SORT_LABEL: Record<SortValue, string> = SORT_OPTIONS.reduce(
  (acc, option) => {
    acc[option.value] = option.label;
    return acc;
  },
  {} as Record<SortValue, string>,
);

const SORT_VALUES: ReadonlySet<SortValue> = new Set(
  SORT_OPTIONS.map((o) => o.value),
);

function isSortValue(v: string): v is SortValue {
  return SORT_VALUES.has(v as SortValue);
}

function discountValue(o: Account): number {
  if (!o.oldPrice || o.oldPrice <= o.price) return 0;
  return ((o.oldPrice - o.price) / o.oldPrice) * 100;
}

/**
 * Client-side search + filter + sort over a server-loaded slice of listings
 * for a single game. State lives in URL params so filter selections are
 * shareable / refresh-safe; the wider 100-row server fetch makes
 * filtering snappy without per-keystroke round-trips. When per-game
 * catalogs grow past ~500 items, lift the filter logic server-side.
 *
 * Each filter type is single-select — picking a different value replaces
 * the previous selection. The dropdown trigger swaps its chevron for an
 * X once a value is set so the user can clear without opening the menu.
 */
export function GameListingsBoard({
  offers,
  gameName,
}: {
  offers: Account[];
  gameName: string;
}) {
  const router = useRouter();
  const searchParams = useSearchParams();

  const q = searchParams.get("q") ?? "";
  const platform = searchParams.get("platform") || null;
  const region = searchParams.get("region") || null;
  const sortParam = searchParams.get("sort") ?? "newest";
  const sort: SortValue = isSortValue(sortParam) ? sortParam : "newest";

  // Local draft for the search input. Decoupled from URL state so a fast
  // burst of keystrokes doesn't get clobbered by `router.replace`'s async
  // re-render — the URL (and therefore the filtered set) catches up via
  // the debounced effect below.
  const [draftQ, setDraftQ] = useState(q);
  const lastPushedQRef = useRef(q);

  useEffect(() => {
    if (q === lastPushedQRef.current) return;
    lastPushedQRef.current = q;
    setDraftQ(q);
  }, [q]);

  const availablePlatforms = useMemo(() => {
    const set = new Set<string>();
    for (const o of offers) {
      const v = o.platform?.trim();
      if (v) set.add(v);
    }
    return Array.from(set).sort((a, b) => a.localeCompare(b));
  }, [offers]);

  const availableRegions = useMemo(() => {
    const set = new Set<string>();
    for (const o of offers) {
      const v = o.region?.trim();
      if (v) set.add(v);
    }
    return Array.from(set).sort((a, b) => a.localeCompare(b));
  }, [offers]);

  const filtered = useMemo(() => {
    const needle = q.trim().toLowerCase();
    const result = offers.filter((o) => {
      if (needle && !o.title.toLowerCase().includes(needle)) return false;
      if (platform && o.platform !== platform) return false;
      if (region && o.region !== region) return false;
      return true;
    });
    if (sort === "price-asc") return [...result].sort((a, b) => a.price - b.price);
    if (sort === "price-desc") return [...result].sort((a, b) => b.price - a.price);
    if (sort === "discount-desc") {
      return [...result].sort((a, b) => discountValue(b) - discountValue(a));
    }
    return result;
  }, [offers, q, platform, region, sort]);

  const updateParams = useCallback(
    (updates: Record<string, string | null>) => {
      const next = new URLSearchParams(searchParams.toString());
      for (const [key, value] of Object.entries(updates)) {
        if (value === null || value === "") next.delete(key);
        else next.set(key, value);
      }
      const qs = next.toString();
      router.replace(qs ? `?${qs}` : "?", { scroll: false });
    },
    [router, searchParams],
  );

  useEffect(() => {
    if (draftQ === q) return;
    const handle = window.setTimeout(() => {
      lastPushedQRef.current = draftQ;
      updateParams({ q: draftQ });
    }, 200);
    return () => window.clearTimeout(handle);
  }, [draftQ, q, updateParams]);

  const hasActiveFilters =
    q.length > 0 || platform !== null || region !== null || sort !== "newest";

  function clearAll() {
    setDraftQ("");
    lastPushedQRef.current = "";
    router.replace("?", { scroll: false });
  }

  return (
    <div className="flex flex-col gap-6">
      <div className="rounded-3xl border border-brand-border-light bg-white p-4">
        <div className="flex flex-wrap items-center gap-3">
          <label className="relative flex min-w-[260px] flex-1 items-center">
            <Search
              className="pointer-events-none absolute left-4 h-4 w-4 text-brand-text-secondary-light"
              strokeWidth={1.75}
            />
            <input
              type="text"
              value={draftQ}
              onChange={(event) => setDraftQ(event.target.value)}
              placeholder={`Search ${gameName} listings`}
              className="h-11 w-full rounded-xl bg-brand-bg-pill pl-10 pr-10 font-display text-[14px] font-medium text-brand-text-primary-light placeholder:text-brand-text-tertiary-dark focus:outline-none focus:ring-2 focus:ring-brand-accent"
            />
            {draftQ ? (
              <button
                type="button"
                onClick={() => {
                  setDraftQ("");
                  lastPushedQRef.current = "";
                  updateParams({ q: null });
                }}
                aria-label="Clear search"
                className="absolute right-2 grid h-7 w-7 place-items-center rounded-lg text-brand-text-secondary-light transition hover:bg-brand-bg-pill hover:text-brand-text-primary-light"
              >
                <X className="h-4 w-4" strokeWidth={2} />
              </button>
            ) : null}
          </label>

          {availablePlatforms.length > 0 && (
            <FilterDropdown
              label="Platform"
              value={platform}
              options={availablePlatforms}
              onChange={(value) => updateParams({ platform: value })}
            />
          )}
          {availableRegions.length > 0 && (
            <FilterDropdown
              label="Region"
              value={region}
              options={availableRegions}
              onChange={(value) => updateParams({ region: value })}
            />
          )}
          <FilterDropdown
            label="Sort"
            value={sort === "newest" ? null : sort}
            valueLabel={sort === "newest" ? null : SORT_LABEL[sort]}
            options={SORT_OPTIONS.map((o) => ({ value: o.value, label: o.label }))}
            onChange={(value) =>
              updateParams({ sort: !value || value === "newest" ? null : value })
            }
          />
        </div>

        <div className="mt-3 flex items-center justify-between font-display text-[12px] text-brand-text-secondary-light">
          <span>
            Showing {filtered.length} of {offers.length}
          </span>
          {hasActiveFilters ? (
            <button
              type="button"
              onClick={clearAll}
              className="font-medium text-brand-text-primary-light underline-offset-4 hover:underline"
            >
              Clear filters
            </button>
          ) : null}
        </div>
      </div>

      {offers.length === 0 ? (
        <EmptyState
          title={`No listings for ${gameName} yet`}
          subtitle="Check back soon — new accounts go up daily."
        />
      ) : filtered.length === 0 ? (
        <EmptyState
          title="No listings match your filters"
          action={
            <button
              type="button"
              onClick={clearAll}
              className="inline-flex h-10 items-center rounded-xl bg-black px-4 font-display text-[13px] font-medium text-white transition hover:bg-neutral-800"
            >
              Clear filters
            </button>
          }
        />
      ) : (
        <div className="grid grid-cols-1 gap-4 sm:grid-cols-2 md:grid-cols-3 lg:grid-cols-4 xl:grid-cols-5">
          {filtered.map((offer) => (
            <ProductCard key={offer.id} account={offer} />
          ))}
        </div>
      )}
    </div>
  );
}

type DropdownOption = string | { value: string; label: string };

/**
 * Single-select dropdown matching the filter-bar look. Trigger shows the
 * label when no value is set; once a value is picked, the chevron flips
 * to an X icon so the user can clear the filter without opening the menu.
 */
function FilterDropdown({
  label,
  value,
  valueLabel,
  options,
  onChange,
}: {
  label: string;
  value: string | null;
  /** Override the displayed selected text (defaults to the value itself). */
  valueLabel?: string | null;
  options: DropdownOption[];
  onChange: (value: string | null) => void;
}) {
  const [open, setOpen] = useState(false);
  const ref = useRef<HTMLDivElement | null>(null);

  useEffect(() => {
    if (!open) return;
    function onMouseDown(event: MouseEvent) {
      if (!ref.current) return;
      if (!ref.current.contains(event.target as Node)) setOpen(false);
    }
    function onKey(event: KeyboardEvent) {
      if (event.key === "Escape") setOpen(false);
    }
    document.addEventListener("mousedown", onMouseDown);
    document.addEventListener("keydown", onKey);
    return () => {
      document.removeEventListener("mousedown", onMouseDown);
      document.removeEventListener("keydown", onKey);
    };
  }, [open]);

  const display = value ? valueLabel ?? value : label;
  const isActive = value !== null;

  return (
    <div ref={ref} className="relative">
      <button
        type="button"
        onClick={() => setOpen((v) => !v)}
        aria-haspopup="listbox"
        aria-expanded={open}
        className={cn(
          "inline-flex h-11 items-center gap-2 rounded-xl border px-4 font-display text-[13px] font-medium transition",
          isActive
            ? "border-brand-text-primary-light bg-brand-text-primary-light text-white"
            : "border-brand-border-light bg-white text-brand-text-primary-light hover:bg-brand-bg-light",
        )}
      >
        <span className="truncate">{display}</span>
        {isActive ? (
          <span
            role="button"
            tabIndex={0}
            aria-label={`Clear ${label}`}
            onClick={(event) => {
              event.stopPropagation();
              onChange(null);
              setOpen(false);
            }}
            onKeyDown={(event) => {
              if (event.key === "Enter" || event.key === " ") {
                event.preventDefault();
                event.stopPropagation();
                onChange(null);
                setOpen(false);
              }
            }}
            className="-mr-1 grid h-5 w-5 cursor-pointer place-items-center rounded transition hover:bg-white/15"
          >
            <X className="h-3.5 w-3.5" strokeWidth={2.5} />
          </span>
        ) : (
          <ChevronDown
            className="h-4 w-4 text-brand-text-secondary-light"
            strokeWidth={1.75}
          />
        )}
      </button>

      {open ? (
        <ul
          role="listbox"
          className="absolute right-0 top-[calc(100%+4px)] z-40 max-h-72 min-w-[180px] overflow-auto rounded-xl border border-brand-border-light bg-white py-1 shadow-lg"
        >
          {options.map((option) => {
            const optValue = typeof option === "string" ? option : option.value;
            const optLabel = typeof option === "string" ? option : option.label;
            const selected = optValue === value;
            return (
              <li key={optValue}>
                <button
                  type="button"
                  role="option"
                  aria-selected={selected}
                  onClick={() => {
                    onChange(optValue);
                    setOpen(false);
                  }}
                  className={cn(
                    "flex w-full items-center px-3 py-2 text-left font-display text-[13px] font-medium transition",
                    selected
                      ? "bg-brand-bg-light text-brand-text-primary-light"
                      : "text-brand-text-primary-light hover:bg-brand-bg-light",
                  )}
                >
                  {optLabel}
                </button>
              </li>
            );
          })}
        </ul>
      ) : null}
    </div>
  );
}

function EmptyState({
  title,
  subtitle,
  action,
}: {
  title: string;
  subtitle?: string;
  action?: React.ReactNode;
}) {
  return (
    <div className="flex flex-col items-center gap-3 rounded-3xl border border-brand-border-light bg-brand-bg-light p-10 text-center">
      <p className="font-display text-[14px] font-medium text-brand-text-primary-light">
        {title}
      </p>
      {subtitle ? (
        <p className="font-display text-[13px] text-brand-text-secondary-light">
          {subtitle}
        </p>
      ) : null}
      {action}
    </div>
  );
}
