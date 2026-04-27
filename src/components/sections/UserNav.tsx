"use client";

import {
  ChevronDown,
  Headphones,
  Heart,
  LogOut,
  ShoppingBag,
  Store,
  User,
} from "lucide-react";
import type { LucideIcon } from "lucide-react";
import Image from "next/image";
import Link from "next/link";
import { usePathname, useRouter } from "next/navigation";
import { useEffect, useMemo, useRef, useState } from "react";
import { LoginPopup } from "@/components/sections/LoginPopup";
import { createSupabaseBrowserClient } from "@/lib/supabase/client";
import { cn } from "@/lib/utils";

type SessionState = {
  signedIn: boolean;
  isSeller: boolean;
  name: string | null;
  avatarUrl: string | null;
};

const INITIAL: SessionState = {
  signedIn: false,
  isSeller: false,
  name: null,
  avatarUrl: null,
};

// Sub-items inside the "My Store" collapsible. Dashboard / Withdrawal don't
// have routes yet — placeholders click into nothing until those pages exist.
const STORE_ITEMS: Array<{ label: string; href: string }> = [
  { label: "Dashboard", href: "#" },
  { label: "Currently Selling", href: "/user/currently-selling" },
  { label: "Create Listing", href: "/sell" },
  { label: "Transactions", href: "/user/transactions" },
  { label: "Withdrawal", href: "#" },
];

export function UserNav() {
  const router = useRouter();
  const pathname = usePathname();
  const [session, setSession] = useState<SessionState>(INITIAL);
  const [ready, setReady] = useState(false);
  const [open, setOpen] = useState(false);
  const [storeOpen, setStoreOpen] = useState(true);
  const [loginOpen, setLoginOpen] = useState(false);
  const wrapperRef = useRef<HTMLDivElement | null>(null);

  useEffect(() => {
    const supabase = createSupabaseBrowserClient();

    const syncProfile = async (userId: string | null | undefined) => {
      if (!userId) {
        setSession(INITIAL);
        return;
      }
      const { data } = await supabase
        .from("profiles")
        .select("is_seller, name, avatar_url")
        .eq("id", userId)
        .maybeSingle();
      setSession({
        signedIn: true,
        isSeller: data?.is_seller ?? false,
        name: data?.name ?? null,
        avatarUrl: data?.avatar_url ?? null,
      });
    };

    supabase.auth.getUser().then(({ data }) => {
      syncProfile(data.user?.id).finally(() => setReady(true));
    });

    const { data: sub } = supabase.auth.onAuthStateChange((_event, authSession) => {
      syncProfile(authSession?.user?.id);
    });
    return () => sub.subscription.unsubscribe();
  }, []);

  // Close on outside click / Escape.
  useEffect(() => {
    if (!open) return;

    function handlePointer(event: MouseEvent) {
      if (
        wrapperRef.current &&
        !wrapperRef.current.contains(event.target as Node)
      ) {
        setOpen(false);
      }
    }
    function handleKey(event: KeyboardEvent) {
      if (event.key === "Escape") setOpen(false);
    }

    document.addEventListener("mousedown", handlePointer);
    document.addEventListener("keydown", handleKey);
    return () => {
      document.removeEventListener("mousedown", handlePointer);
      document.removeEventListener("keydown", handleKey);
    };
  }, [open]);

  // Auto-expand the My Store collapsible if the current page is one of its
  // sub-routes — keeps the active item visible when the dropdown opens.
  const isOnStorePath = useMemo(
    () =>
      STORE_ITEMS.some(
        (item) => item.href !== "#" && pathname?.startsWith(item.href),
      ),
    [pathname],
  );
  useEffect(() => {
    if (open && isOnStorePath) setStoreOpen(true);
  }, [open, isOnStorePath]);

  function handleClick() {
    if (!ready) return;
    if (!session.signedIn) {
      setLoginOpen(true);
      return;
    }
    setOpen((v) => !v);
  }

  async function signOut() {
    const supabase = createSupabaseBrowserClient();
    await supabase.auth.signOut();
    setOpen(false);
    router.push("/");
    router.refresh();
  }

  const close = () => setOpen(false);

  return (
    <div ref={wrapperRef} className="relative">
      <button
        type="button"
        aria-label={session.signedIn ? "Account menu" : "Sign in"}
        aria-expanded={open}
        onClick={handleClick}
        className="grid h-16 w-16 place-items-center rounded-2xl bg-black text-white transition hover:bg-brand-bg-surface"
      >
        <User className="h-6 w-6" strokeWidth={1.5} />
      </button>

      {open && session.signedIn ? (
        <div
          role="menu"
          className="absolute right-0 top-[calc(100%+8px)] z-50 flex w-[345px] flex-col gap-3 rounded-2xl bg-[#242424] p-4 shadow-2xl"
        >
          <Header
            name={session.name}
            avatarUrl={session.avatarUrl}
            showSellCta={!session.isSeller}
            onLinkClick={close}
          />

          <DropdownItem
            href="/user/orders"
            icon={ShoppingBag}
            label="My orders"
            active={pathname === "/user/orders"}
            highlighted
            onClick={close}
          />

          {session.isSeller ? (
            <StoreCollapsible
              open={storeOpen}
              toggle={() => setStoreOpen((v) => !v)}
              pathname={pathname ?? ""}
              onLinkClick={close}
            />
          ) : null}

          <div className="flex flex-col">
            <DropdownItem
              href="#"
              icon={Headphones}
              label="Help center"
              onClick={close}
            />
            <DropdownItem
              href="/wishlist"
              icon={Heart}
              label="Wishlist"
              active={pathname === "/wishlist"}
              onClick={close}
            />
            <button
              type="button"
              role="menuitem"
              onClick={signOut}
              className="flex h-12 items-center gap-3 rounded-lg px-3 font-display text-[16px] font-normal text-white transition hover:bg-[#2a2a2a]"
            >
              <LogOut className="h-5 w-5" strokeWidth={1.5} />
              Log out
            </button>
          </div>
        </div>
      ) : null}

      <LoginPopup open={loginOpen} onClose={() => setLoginOpen(false)} />
    </div>
  );
}

function Header({
  name,
  avatarUrl,
  showSellCta,
  onLinkClick,
}: {
  name: string | null;
  avatarUrl: string | null;
  showSellCta: boolean;
  onLinkClick: () => void;
}) {
  return (
    <div className="flex items-center gap-3">
      <Link
        href="/profile"
        onClick={onLinkClick}
        className="flex min-w-0 flex-1 items-center gap-3 rounded-lg transition hover:opacity-80"
      >
        <span className="relative grid h-14 w-14 shrink-0 place-items-center overflow-hidden rounded-full bg-[#2a2a2a]">
          {avatarUrl ? (
            <Image
              src={avatarUrl}
              alt=""
              fill
              sizes="56px"
              className="object-cover"
            />
          ) : (
            <User className="h-6 w-6 text-white" strokeWidth={1.5} />
          )}
        </span>
        <span className="min-w-0 flex-1 truncate font-display text-[16px] font-medium text-white">
          {name ?? "User"}
        </span>
      </Link>
      {showSellCta ? (
        <Link
          href="/sell"
          onClick={onLinkClick}
          className="inline-flex h-11 shrink-0 items-center justify-center rounded-lg bg-white px-5 font-display text-[16px] font-medium text-black transition hover:bg-brand-bg-light"
        >
          Sell
        </Link>
      ) : null}
    </div>
  );
}

function StoreCollapsible({
  open,
  toggle,
  pathname,
  onLinkClick,
}: {
  open: boolean;
  toggle: () => void;
  pathname: string;
  onLinkClick: () => void;
}) {
  return (
    <div className="rounded-lg bg-[#2a2a2a]">
      <button
        type="button"
        aria-expanded={open}
        aria-controls="my-store-collapsible"
        onClick={toggle}
        className="flex h-12 w-full items-center gap-3 rounded-lg bg-[#333333] px-3 text-white transition hover:brightness-110"
      >
        <Store className="h-5 w-5" strokeWidth={1.5} />
        <span className="flex-1 text-left font-display text-[16px] font-normal">
          My Store
        </span>
        <ChevronDown
          className={cn(
            "h-5 w-5 transition-transform duration-200",
            open ? "rotate-180" : "rotate-0",
          )}
          strokeWidth={1.5}
        />
      </button>
      {/*
        Modern CSS height-auto animation: collapse via grid-template-rows
        0fr ↔ 1fr on the outer grid, and clip overflow on the child. No JS,
        no library, no measured height — handles arbitrary content height.
      */}
      <div
        id="my-store-collapsible"
        className={cn(
          "grid transition-[grid-template-rows] duration-200 ease-out",
          open ? "grid-rows-[1fr]" : "grid-rows-[0fr]",
        )}
      >
        <ul className="overflow-hidden">
          {STORE_ITEMS.map((item) => {
            const isActive =
              item.href !== "#" && pathname.startsWith(item.href);
            const isPlaceholder = item.href === "#";
            return (
              <li key={item.label}>
                {isPlaceholder ? (
                  <span className="flex h-11 cursor-default items-center px-3 font-display text-[16px] font-normal text-[#808080]">
                    {item.label}
                  </span>
                ) : (
                  <Link
                    href={item.href}
                    onClick={onLinkClick}
                    className={cn(
                      "flex h-11 items-center px-3 font-display text-[16px] font-normal transition",
                      isActive
                        ? "text-white"
                        : "text-[#808080] hover:text-white",
                    )}
                  >
                    {item.label}
                  </Link>
                )}
              </li>
            );
          })}
        </ul>
      </div>
    </div>
  );
}

function DropdownItem({
  href,
  icon: Icon,
  label,
  active = false,
  highlighted = false,
  onClick,
}: {
  href: string;
  icon: LucideIcon;
  label: string;
  active?: boolean;
  highlighted?: boolean;
  onClick: () => void;
}) {
  const isPlaceholder = href === "#";
  const className = cn(
    "flex h-12 items-center gap-3 rounded-lg px-3 font-display text-[16px] font-normal text-white transition",
    highlighted && "bg-[#333333]",
    active && "bg-[#333333]",
    !highlighted && !active && "hover:bg-[#2a2a2a]",
    isPlaceholder && "cursor-default",
  );

  if (isPlaceholder) {
    return (
      <span role="menuitem" className={className}>
        <Icon className="h-5 w-5" strokeWidth={1.5} />
        {label}
      </span>
    );
  }

  return (
    <Link href={href} role="menuitem" onClick={onClick} className={className}>
      <Icon className="h-5 w-5" strokeWidth={1.5} />
      {label}
    </Link>
  );
}
