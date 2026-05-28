"use client";

import { createContext, useContext, useEffect, useState, useTransition } from "react";
import { useAuthPrompt } from "@/components/auth/AuthPromptProvider";
import { toggleWishlist } from "@/lib/wishlist-actions";

type WishlistContextValue = {
  isWishlisted: (accountId: string) => boolean;
  toggle: (accountId: string) => void;
  /** `false` once we know the user is anonymous; toggling becomes a login prompt. */
  enabled: boolean;
  /** True while a toggle is in-flight; card can disable the button if it cares. */
  pending: boolean;
};

const WishlistContext = createContext<WishlistContextValue | null>(null);

type AuthState = "unknown" | "anon" | "authed";

export function WishlistProvider({ children }: { children: React.ReactNode }) {
  const [ids, setIds] = useState<Set<string>>(() => new Set());
  const [auth, setAuth] = useState<AuthState>("unknown");
  const [pending, startTransition] = useTransition();
  const { requireLogin } = useAuthPrompt();

  // Hydrate wishlist state after the (cacheable) shell mounts. The shell HTML
  // is identical for every visitor so it can be served from the CDN.
  useEffect(() => {
    let cancelled = false;
    fetch("/api/wishlist/ids", { credentials: "same-origin" })
      .then((r) => (r.ok ? r.json() : null))
      .then((data: { authenticated: boolean; ids: string[] } | null) => {
        if (cancelled || !data) return;
        setAuth(data.authenticated ? "authed" : "anon");
        if (data.ids.length > 0) setIds(new Set(data.ids));
      })
      .catch(() => {
        // Network blip — leave state as unknown so clicks still attempt the
        // server action, which will prompt for login if needed.
      });
    return () => {
      cancelled = true;
    };
  }, []);

  const toggle = (accountId: string) => {
    if (auth === "anon") {
      // Known anonymous — skip the optimistic flip (a heart flashing red and
      // rolling back would be jarring) and prompt for login immediately.
      requireLogin();
      return;
    }

    const wasLiked = ids.has(accountId);
    setIds((prev) => {
      const next = new Set(prev);
      if (wasLiked) next.delete(accountId);
      else next.add(accountId);
      return next;
    });

    startTransition(async () => {
      const result = await toggleWishlist(accountId);
      if ("error" in result) {
        setIds((prev) => {
          const next = new Set(prev);
          if (wasLiked) next.add(accountId);
          else next.delete(accountId);
          return next;
        });
        if (result.error === "SIGN_IN_REQUIRED") {
          setAuth("anon");
          requireLogin();
        }
      }
    });
  };

  return (
    <WishlistContext.Provider
      value={{
        enabled: auth === "authed",
        pending,
        isWishlisted: (id) => ids.has(id),
        toggle,
      }}
    >
      {children}
    </WishlistContext.Provider>
  );
}

export function useWishlist(): WishlistContextValue | null {
  return useContext(WishlistContext);
}
