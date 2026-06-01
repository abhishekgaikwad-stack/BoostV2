"use client";

import { Globe } from "lucide-react";
import { useEffect, useRef, useState } from "react";
import { SearchBar } from "@/components/cards/SearchBar";
import { RegionPopup } from "@/components/sections/RegionPopup";
import { SearchOverlay } from "@/components/sections/SearchOverlay";
import { UserNav } from "@/components/sections/UserNav";

export function SiteHeader() {
  const [isSearchOpen, setSearchOpen] = useState(false);
  const [isRegionOpen, setRegionOpen] = useState(false);
  const headerRef = useRef<HTMLElement | null>(null);

  useEffect(() => {
    if (!isSearchOpen) return;

    function handlePointerDown(event: MouseEvent) {
      if (
        headerRef.current &&
        !headerRef.current.contains(event.target as Node)
      ) {
        setSearchOpen(false);
      }
    }

    function handleKey(event: KeyboardEvent) {
      if (event.key === "Escape") setSearchOpen(false);
    }

    document.addEventListener("mousedown", handlePointerDown);
    document.addEventListener("keydown", handleKey);
    return () => {
      document.removeEventListener("mousedown", handlePointerDown);
      document.removeEventListener("keydown", handleKey);
    };
  }, [isSearchOpen]);

  return (
    <header
      ref={headerRef}
      className="sticky top-0 z-20 flex items-center gap-6 bg-white px-[112px] pb-6 pt-[calc(var(--spacing)*12)]"
    >
      <SearchBar className="flex-1" onOpen={() => setSearchOpen(true)} />
      <div className="flex items-center gap-2">
        <button
          type="button"
          aria-label="Region"
          onClick={() => setRegionOpen(true)}
          className="grid h-16 w-16 place-items-center rounded-2xl bg-black text-white transition hover:bg-brand-bg-surface"
        >
          <Globe className="h-6 w-6" strokeWidth={1.5} />
        </button>
        <UserNav />
      </div>

      <RegionPopup open={isRegionOpen} onClose={() => setRegionOpen(false)} />

      {isSearchOpen ? (
        <>
          <div
            className="fixed inset-0 z-40 bg-black/50 backdrop-blur-[4px]"
            aria-hidden
            onClick={() => setSearchOpen(false)}
          />
          <div className="absolute left-[112px] right-[112px] top-[calc(var(--spacing)*12)] z-50">
            <SearchOverlay />
          </div>
        </>
      ) : null}
    </header>
  );
}
