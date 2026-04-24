"use client";

import { createContext, useCallback, useContext, useState } from "react";
import { LoginPopup } from "@/components/sections/LoginPopup";

type AuthPromptValue = {
  /** Opens the login popup. Safe to call from anywhere inside the provider. */
  requireLogin: () => void;
};

const AuthPromptContext = createContext<AuthPromptValue | null>(null);

/**
 * Hosts a single LoginPopup instance for the surrounding subtree so features
 * that need auth (wishlist heart, /wishlist page, future buy-flow gates) can
 * prompt the user without each one mounting its own popup.
 */
export function AuthPromptProvider({
  children,
}: {
  children: React.ReactNode;
}) {
  const [open, setOpen] = useState(false);
  const requireLogin = useCallback(() => setOpen(true), []);

  return (
    <AuthPromptContext.Provider value={{ requireLogin }}>
      {children}
      <LoginPopup open={open} onClose={() => setOpen(false)} />
    </AuthPromptContext.Provider>
  );
}

export function useAuthPrompt(): AuthPromptValue {
  const ctx = useContext(AuthPromptContext);
  if (!ctx) {
    throw new Error(
      "useAuthPrompt must be used inside an <AuthPromptProvider>.",
    );
  }
  return ctx;
}
