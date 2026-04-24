"use client";

import { createContext, useContext, useState, useTransition } from "react";
import { useAuthPrompt } from "@/components/auth/AuthPromptProvider";
import { toggleWishlist } from "@/lib/wishlist-actions";

type WishlistContextValue = {
  isWishlisted: (accountId: string) => boolean;
  toggle: (accountId: string) => void;
  /** `false` for anonymous users — hearts still render but toggling is a no-op. */
  enabled: boolean;
  /** True while a toggle is in-flight; card can disable the button if it cares. */
  pending: boolean;
};

const WishlistContext = createContext<WishlistContextValue | null>(null);

export function WishlistProvider({
  initialIds,
  enabled,
  children,
}: {
  initialIds: string[];
  enabled: boolean;
  children: React.ReactNode;
}) {
  const [ids, setIds] = useState<Set<string>>(() => new Set(initialIds));
  const [pending, startTransition] = useTransition();
  const { requireLogin } = useAuthPrompt();

  const toggle = (accountId: string) => {
    if (!enabled) {
      // Skip the optimistic flip — an anon heart flashing red and rolling back
      // would be jarring. Prompt for login immediately instead.
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
        // Roll back the optimistic flip.
        setIds((prev) => {
          const next = new Set(prev);
          if (wasLiked) next.add(accountId);
          else next.delete(accountId);
          return next;
        });
        // Session expired mid-session (cookie dropped, browser restarted, etc).
        if (result.error === "SIGN_IN_REQUIRED") requireLogin();
      }
    });
  };

  return (
    <WishlistContext.Provider
      value={{
        enabled,
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
