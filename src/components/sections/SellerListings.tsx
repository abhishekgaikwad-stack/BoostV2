"use client";

import { ChevronDown, Search } from "lucide-react";
import { useMemo, useState } from "react";
import { ProductCard } from "@/components/cards/ProductCard";
import { PriceFilter } from "@/components/sections/PriceFilter";
import { cn } from "@/lib/utils";
import type { Account } from "@/types";

type Sort = "newly" | "price-asc" | "price-desc" | "name";

export function SellerListings({
  offers,
  emptyLabel,
}: {
  offers: Account[];
  emptyLabel: string;
}) {
  const [search, setSearch] = useState("");
  const [game, setGame] = useState<string>("all");
  const [minPrice, setMinPrice] = useState<string>("");
  const [maxPrice, setMaxPrice] = useState<string>("");
  const [sort, setSort] = useState<Sort>("newly");

  const games = useMemo(() => {
    const seen = new Map<string, string>();
    for (const offer of offers) {
      if (!seen.has(offer.game.slug)) seen.set(offer.game.slug, offer.game.name);
    }
    return Array.from(seen, ([slug, name]) => ({ slug, name }));
  }, [offers]);

  const priceBounds = useMemo(() => {
    if (offers.length === 0) return { min: 0, max: 100 };
    const prices = offers.map((o) => o.price);
    return {
      min: Math.floor(Math.min(...prices)),
      max: Math.ceil(Math.max(...prices)),
    };
  }, [offers]);

  const visible = useMemo(() => {
    let list = offers;
    const q = search.trim().toLowerCase();
    if (q) list = list.filter((o) => o.title.toLowerCase().includes(q));
    if (game !== "all") list = list.filter((o) => o.game.slug === game);
    const min = Number.parseFloat(minPrice);
    const max = Number.parseFloat(maxPrice);
    if (!Number.isNaN(min)) list = list.filter((o) => o.price >= min);
    if (!Number.isNaN(max)) list = list.filter((o) => o.price <= max);

    const sorted = [...list];
    if (sort === "price-asc") sorted.sort((a, b) => a.price - b.price);
    else if (sort === "price-desc") sorted.sort((a, b) => b.price - a.price);
    else if (sort === "name")
      sorted.sort((a, b) => a.title.localeCompare(b.title));
    // "newly" keeps original order (proxy for newest-first)
    return sorted;
  }, [offers, search, game, minPrice, maxPrice, sort]);

  const filtersActive =
    search.trim() !== "" || game !== "all" || minPrice !== "" || maxPrice !== "";

  return (
    <div className="flex flex-col gap-6">
      <div className="flex flex-col gap-3 rounded-2xl border border-brand-border-light bg-white p-3 md:flex-row md:items-center">
        <label className="flex h-11 flex-1 items-center gap-2 rounded-xl bg-brand-bg-pill px-4">
          <Search
            className="h-4 w-4 text-brand-text-secondary-dark"
            strokeWidth={1.5}
          />
          <input
            type="search"
            value={search}
            onChange={(e) => setSearch(e.target.value)}
            placeholder="Search listings"
            className="flex-1 bg-transparent font-display text-[14px] font-medium text-brand-text-primary-light placeholder:text-brand-text-tertiary-dark focus:outline-none"
          />
        </label>

        <Select
          value={game}
          onChange={setGame}
          options={[
            { value: "all", label: "All games" },
            ...games.map((g) => ({ value: g.slug, label: g.name })),
          ]}
        />

        <PriceFilter
          min={priceBounds.min}
          max={priceBounds.max}
          value={[minPrice, maxPrice]}
          onChange={(next, nextMax) => {
            setMinPrice(next);
            setMaxPrice(nextMax);
          }}
        />

        <Select
          value={sort}
          onChange={(v) => setSort(v as Sort)}
          options={[
            { value: "newly", label: "Newly added" },
            { value: "price-asc", label: "Price: low to high" },
            { value: "price-desc", label: "Price: high to low" },
            { value: "name", label: "Name A–Z" },
          ]}
        />
      </div>

      {visible.length > 0 ? (
        <div className="grid grid-cols-1 gap-4 sm:grid-cols-2 md:grid-cols-3 lg:grid-cols-4 xl:grid-cols-5">
          {visible.map((offer) => (
            <ProductCard key={offer.id} account={offer} />
          ))}
        </div>
      ) : (
        <div className="rounded-3xl border border-brand-border-light bg-brand-bg-light p-10 text-center font-display text-[14px] font-medium text-brand-text-secondary-light">
          {offers.length === 0
            ? emptyLabel
            : filtersActive
              ? "No listings match your filters."
              : emptyLabel}
        </div>
      )}
    </div>
  );
}

function Select({
  value,
  onChange,
  options,
}: {
  value: string;
  onChange: (value: string) => void;
  options: Array<{ value: string; label: string }>;
}) {
  return (
    <div className="relative">
      <select
        value={value}
        onChange={(e) => onChange(e.target.value)}
        className={cn(
          "h-11 w-full min-w-[180px] appearance-none rounded-xl bg-brand-bg-pill pl-4 pr-10 font-display text-[14px] font-medium text-brand-text-primary-light focus:outline-none",
        )}
      >
        {options.map((o) => (
          <option key={o.value} value={o.value}>
            {o.label}
          </option>
        ))}
      </select>
      <ChevronDown
        className="pointer-events-none absolute right-3 top-1/2 h-4 w-4 -translate-y-1/2 text-brand-text-secondary-dark"
        strokeWidth={1.5}
      />
    </div>
  );
}

