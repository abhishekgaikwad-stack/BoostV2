"use client";

import { ChevronDown, Search } from "lucide-react";
import { useMemo, useState } from "react";
import {
  SellerListingRow,
  type SellerListingRowData,
} from "@/components/cards/SellerListingRow";
import { cn } from "@/lib/utils";

type Sort = "newest" | "oldest" | "price-asc" | "price-desc" | "name";

export function CurrentlySellingList({
  listings,
}: {
  listings: SellerListingRowData[];
}) {
  const [search, setSearch] = useState("");
  const [game, setGame] = useState<string>("all");
  const [sort, setSort] = useState<Sort>("newest");

  const games = useMemo(() => {
    const seen = new Map<string, string>();
    for (const listing of listings) {
      if (!seen.has(listing.game.slug)) {
        seen.set(listing.game.slug, listing.game.name);
      }
    }
    return Array.from(seen, ([slug, name]) => ({ slug, name }));
  }, [listings]);

  const visible = useMemo(() => {
    let list = listings;
    const q = search.trim().toLowerCase();
    if (q) list = list.filter((l) => l.title.toLowerCase().includes(q));
    if (game !== "all") list = list.filter((l) => l.game.slug === game);

    const sorted = [...list];
    switch (sort) {
      case "newest":
        sorted.sort(
          (a, b) => Date.parse(b.createdAt) - Date.parse(a.createdAt),
        );
        break;
      case "oldest":
        sorted.sort(
          (a, b) => Date.parse(a.createdAt) - Date.parse(b.createdAt),
        );
        break;
      case "price-asc":
        sorted.sort((a, b) => a.price - b.price);
        break;
      case "price-desc":
        sorted.sort((a, b) => b.price - a.price);
        break;
      case "name":
        sorted.sort((a, b) => a.title.localeCompare(b.title));
        break;
    }
    return sorted;
  }, [listings, search, game, sort]);

  const filtersActive = search.trim() !== "" || game !== "all";

  return (
    <div className="flex flex-col gap-4">
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
            placeholder="Search your listings"
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

        <Select
          value={sort}
          onChange={(v) => setSort(v as Sort)}
          options={[
            { value: "newest", label: "Newest first" },
            { value: "oldest", label: "Oldest first" },
            { value: "price-asc", label: "Price: low to high" },
            { value: "price-desc", label: "Price: high to low" },
            { value: "name", label: "Name A–Z" },
          ]}
        />
      </div>

      {visible.length > 0 ? (
        <ul className="flex flex-col gap-3">
          {visible.map((listing) => (
            <li key={listing.id}>
              <SellerListingRow listing={listing} />
            </li>
          ))}
        </ul>
      ) : (
        <div className="rounded-3xl border border-brand-border-light bg-brand-bg-light p-10 text-center font-display text-[14px] font-medium text-brand-text-secondary-light">
          {filtersActive
            ? "No listings match your filters."
            : "Nothing to manage yet."}
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
