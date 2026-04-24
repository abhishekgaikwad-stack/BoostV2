"use client";

import { Heart, LogOut, Package, User, UserCircle } from "lucide-react";
import Link from "next/link";
import { useRouter } from "next/navigation";
import { useEffect, useRef, useState } from "react";
import { LoginPopup } from "@/components/sections/LoginPopup";
import { createSupabaseBrowserClient } from "@/lib/supabase/client";
import { cn } from "@/lib/utils";

type SessionState = {
  signedIn: boolean;
  isSeller: boolean;
};

const INITIAL: SessionState = { signedIn: false, isSeller: false };

export function UserNav() {
  const router = useRouter();
  const [session, setSession] = useState<SessionState>(INITIAL);
  const [ready, setReady] = useState(false);
  const [open, setOpen] = useState(false);
  const [loginOpen, setLoginOpen] = useState(false);
  const wrapperRef = useRef<HTMLDivElement | null>(null);

  useEffect(() => {
    const supabase = createSupabaseBrowserClient();

    const syncProfile = async (userId: string | null | undefined) => {
      if (!userId) {
        setSession({ signedIn: false, isSeller: false });
        return;
      }
      const { data } = await supabase
        .from("profiles")
        .select("is_seller")
        .eq("id", userId)
        .maybeSingle();
      setSession({ signedIn: true, isSeller: data?.is_seller ?? false });
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
          className="absolute right-0 top-[calc(100%+8px)] z-50 w-56 overflow-hidden rounded-2xl border border-brand-border-light bg-white py-1 shadow-xl"
        >
          <MenuLink
            href="/profile"
            icon={<UserCircle className="h-4 w-4" strokeWidth={1.5} />}
            label="Profile"
            onClick={() => setOpen(false)}
          />
          <MenuLink
            href="/wishlist"
            icon={<Heart className="h-4 w-4" strokeWidth={1.5} />}
            label="Wishlist"
            onClick={() => setOpen(false)}
          />
          {session.isSeller ? (
            <MenuLink
              href="/user/currently-selling"
              icon={<Package className="h-4 w-4" strokeWidth={1.5} />}
              label="Currently selling"
              onClick={() => setOpen(false)}
            />
          ) : null}
          <div className="my-1 border-t border-brand-border-light" />
          <button
            type="button"
            role="menuitem"
            onClick={signOut}
            className={cn(
              "flex w-full items-center gap-3 px-4 py-2.5 text-left font-display text-[13px] font-medium text-brand-discount transition hover:bg-brand-bg-light",
            )}
          >
            <LogOut className="h-4 w-4" strokeWidth={1.5} />
            Log out
          </button>
        </div>
      ) : null}

      <LoginPopup open={loginOpen} onClose={() => setLoginOpen(false)} />
    </div>
  );
}

function MenuLink({
  href,
  icon,
  label,
  onClick,
}: {
  href: string;
  icon: React.ReactNode;
  label: string;
  onClick: () => void;
}) {
  return (
    <Link
      href={href}
      role="menuitem"
      onClick={onClick}
      className="flex items-center gap-3 px-4 py-2.5 font-display text-[13px] font-medium text-brand-text-primary-light transition hover:bg-brand-bg-light"
    >
      {icon}
      {label}
    </Link>
  );
}
