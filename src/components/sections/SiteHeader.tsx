"use client";

import { Globe, Heart, ShoppingBag, Tag, User } from "lucide-react";
import Image from "next/image";
import Link from "next/link";
import { useEffect, useRef, useState } from "react";
import { SearchBar } from "@/components/cards/SearchBar";
import { LoginPopup } from "@/components/sections/LoginPopup";
import { SearchOverlay } from "@/components/sections/SearchOverlay";
import { assetUrl } from "@/lib/images";
import { cn } from "@/lib/utils";

const sidebarNav = [
  { id: "orders", label: "Orders", icon: ShoppingBag },
  { id: "sell", label: "Sell", icon: Tag },
  { id: "wishlist", label: "Wishlist", icon: Heart },
];

export function SiteHeader() {
  const [isSearchOpen, setSearchOpen] = useState(false);
  const [isLoginOpen, setLoginOpen] = useState(false);
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
    <>
      <aside className="fixed left-0 top-0 z-30 hidden h-screen w-[120px] flex-col items-center gap-6 bg-black py-6 lg:flex">
        <Link
          href="/"
          className="flex flex-col items-center gap-[calc(var(--spacing)*2)]"
          aria-label="Boost home"
        >
          <span className="relative block h-[72px] w-[72px]">
            <Image
              src={assetUrl("boost-logo-icon.svg")}
              alt="Boost"
              fill
              sizes="72px"
              priority
              className="object-contain"
            />
          </span>
          <span className="font-display text-[16px] font-medium leading-5 text-white">
            boost
          </span>
        </Link>
        <nav className="mt-10 flex flex-col items-center gap-7">
          {sidebarNav.map((item) => (
            <Link
              key={item.id}
              href={`/${item.id}`}
              className="flex flex-col items-center gap-2"
            >
              <span
                className={cn(
                  "grid h-14 w-14 place-items-center rounded-xl bg-brand-bg-elevated text-brand-text-primary-dark transition hover:bg-brand-border",
                )}
              >
                <item.icon className="h-6 w-6" strokeWidth={1.5} />
              </span>
              <span className="font-display text-[12px] font-normal leading-5 text-brand-text-secondary-dark">
                {item.label}
              </span>
            </Link>
          ))}
        </nav>
      </aside>

      <header
        ref={headerRef}
        className="sticky top-0 z-20 flex items-center gap-6 bg-white px-[112px] pb-6 pt-[calc(var(--spacing)*12)]"
      >
        <SearchBar
          className="flex-1"
          onOpen={() => setSearchOpen(true)}
        />
        <div className="flex items-center gap-2">
          <button
            type="button"
            aria-label="Language"
            className="grid h-16 w-16 place-items-center rounded-2xl bg-black text-white transition hover:bg-brand-bg-surface"
          >
            <Globe className="h-6 w-6" strokeWidth={1.5} />
          </button>
          <button
            type="button"
            aria-label="Account"
            onClick={() => setLoginOpen(true)}
            className="grid h-16 w-16 place-items-center rounded-2xl bg-black text-white transition hover:bg-brand-bg-surface"
          >
            <User className="h-6 w-6" strokeWidth={1.5} />
          </button>
        </div>

        <LoginPopup open={isLoginOpen} onClose={() => setLoginOpen(false)} />

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
    </>
  );
}
