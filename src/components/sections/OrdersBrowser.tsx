"use client";

import { ChevronDown, Search, X } from "lucide-react";
import { useMemo, useState } from "react";
import { OrderCard } from "@/components/sections/OrderCard";
import type { Order } from "@/lib/orders";

type DateRange = "all" | "7d" | "30d" | "90d" | "year";

const DATE_OPTIONS: Array<{ value: DateRange; label: string }> = [
  { value: "all", label: "All time" },
  { value: "7d", label: "Last 7 days" },
  { value: "30d", label: "Last 30 days" },
  { value: "90d", label: "Last 90 days" },
  { value: "year", label: "This year" },
];

// Earliest `createdAt` (inclusive) an order may have to pass the filter.
// `null` means no lower bound. Computed at filter time so "last N days" is
// always relative to now, not to render time.
function cutoffFor(range: DateRange): number | null {
  if (range === "all") return null;
  const now = new Date();
  if (range === "year") return new Date(now.getFullYear(), 0, 1).getTime();
  const days = range === "7d" ? 7 : range === "30d" ? 30 : 90;
  return now.getTime() - days * 24 * 60 * 60 * 1000;
}

export function OrdersBrowser({ orders }: { orders: Order[] }) {
  const [search, setSearch] = useState("");
  const [product, setProduct] = useState("all");
  const [dateRange, setDateRange] = useState<DateRange>("all");

  // Distinct product (game) names present in the buyer's orders, for the
  // Product dropdown. Sorted so the list is stable across renders.
  const products = useMemo(() => {
    const names = new Set<string>();
    for (const order of orders) {
      if (order.offer) names.add(order.offer.game.name);
    }
    return Array.from(names).sort((a, b) => a.localeCompare(b));
  }, [orders]);

  const filtered = useMemo(() => {
    const q = search.trim().toLowerCase();
    const cutoff = cutoffFor(dateRange);
    return orders.filter((order) => {
      if (product !== "all" && order.offer?.game.name !== product) return false;
      if (cutoff !== null && new Date(order.createdAt).getTime() < cutoff) {
        return false;
      }
      if (q) {
        const haystack = [
          order.id,
          order.offer?.game.name,
          order.offer?.title,
        ]
          .filter(Boolean)
          .join(" ")
          .toLowerCase();
        if (!haystack.includes(q)) return false;
      }
      return true;
    });
  }, [orders, search, product, dateRange]);

  const hasFilters = search.trim() !== "" || product !== "all" || dateRange !== "all";

  return (
    <div className="flex flex-col gap-5">
      <div className="flex flex-col gap-3 sm:flex-row sm:items-center">
        <div className="relative flex-1">
          <Search
            className="pointer-events-none absolute left-4 top-1/2 h-4 w-4 -translate-y-1/2 text-brand-text-tertiary-dark"
            strokeWidth={1.5}
          />
          <input
            type="text"
            value={search}
            onChange={(e) => setSearch(e.target.value)}
            placeholder="Search by order ID or product"
            aria-label="Search orders"
            className="h-12 w-full rounded-2xl bg-brand-bg-pill pl-11 pr-10 font-display text-[14px] font-medium text-brand-text-primary-light placeholder:text-brand-text-tertiary-dark focus:outline-none focus:ring-2 focus:ring-black/10"
          />
          {search ? (
            <button
              type="button"
              onClick={() => setSearch("")}
              aria-label="Clear search"
              className="absolute right-3 top-1/2 grid h-6 w-6 -translate-y-1/2 place-items-center rounded-full text-brand-text-tertiary-dark transition hover:bg-black/5 hover:text-brand-text-primary-light"
            >
              <X className="h-4 w-4" strokeWidth={1.5} />
            </button>
          ) : null}
        </div>

        <FilterSelect
          label="Product"
          value={product}
          onChange={setProduct}
        >
          <option value="all">All products</option>
          {products.map((name) => (
            <option key={name} value={name}>
              {name}
            </option>
          ))}
        </FilterSelect>

        <FilterSelect
          label="Date"
          value={dateRange}
          onChange={(v) => setDateRange(v as DateRange)}
        >
          {DATE_OPTIONS.map((opt) => (
            <option key={opt.value} value={opt.value}>
              {opt.label}
            </option>
          ))}
        </FilterSelect>
      </div>

      {filtered.length > 0 ? (
        <ul className="flex flex-col gap-4">
          {filtered.map((order) => (
            <OrderCard key={order.id} order={order} />
          ))}
        </ul>
      ) : (
        <div className="flex flex-col items-center gap-3 rounded-3xl border border-brand-border-light bg-brand-bg-light p-10 text-center">
          <p className="font-display text-[14px] font-medium text-brand-text-secondary-light">
            No orders match your filters.
          </p>
          {hasFilters ? (
            <button
              type="button"
              onClick={() => {
                setSearch("");
                setProduct("all");
                setDateRange("all");
              }}
              className="font-display text-[13px] font-medium text-brand-text-primary-light underline hover:text-brand-text-secondary-light"
            >
              Clear filters
            </button>
          ) : null}
        </div>
      )}
    </div>
  );
}

function FilterSelect({
  label,
  value,
  onChange,
  children,
}: {
  label: string;
  value: string;
  onChange: (value: string) => void;
  children: React.ReactNode;
}) {
  return (
    <label className="relative flex h-12 items-center">
      <span className="sr-only">{label}</span>
      <select
        value={value}
        onChange={(e) => onChange(e.target.value)}
        aria-label={label}
        className="h-12 appearance-none rounded-2xl bg-brand-bg-pill pl-4 pr-10 font-display text-[14px] font-medium text-brand-text-primary-light focus:outline-none focus:ring-2 focus:ring-black/10"
      >
        {children}
      </select>
      <ChevronDown
        className="pointer-events-none absolute right-3 top-1/2 h-4 w-4 -translate-y-1/2 text-brand-text-tertiary-dark"
        strokeWidth={1.5}
      />
    </label>
  );
}
