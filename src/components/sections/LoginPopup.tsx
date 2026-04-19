"use client";

import { Mail, X } from "lucide-react";
import { useEffect, useRef, useState } from "react";
import { createSupabaseBrowserClient } from "@/lib/supabase/client";
import { cn } from "@/lib/utils";

type Mode = "methods" | "email";

export function LoginPopup({
  open,
  onClose,
}: {
  open: boolean;
  onClose: () => void;
}) {
  const [mode, setMode] = useState<Mode>("methods");
  const [email, setEmail] = useState("");
  const [status, setStatus] = useState<"idle" | "sending" | "sent" | "error">(
    "idle",
  );
  const [errorMsg, setErrorMsg] = useState<string | null>(null);
  const cardRef = useRef<HTMLDivElement | null>(null);
  const supabase = createSupabaseBrowserClient();

  async function signInWithProvider(provider: "google" | "discord") {
    setErrorMsg(null);
    const { error } = await supabase.auth.signInWithOAuth({
      provider,
      options: {
        redirectTo: `${window.location.origin}/api/auth/callback`,
      },
    });
    if (error) setErrorMsg(error.message);
  }

  async function sendMagicLink(event: React.FormEvent<HTMLFormElement>) {
    event.preventDefault();
    setStatus("sending");
    setErrorMsg(null);
    const { error } = await supabase.auth.signInWithOtp({
      email,
      options: {
        emailRedirectTo: `${window.location.origin}/api/auth/callback`,
      },
    });
    if (error) {
      setStatus("error");
      setErrorMsg(error.message);
    } else {
      setStatus("sent");
    }
  }

  useEffect(() => {
    if (!open) return;

    function handleKey(event: KeyboardEvent) {
      if (event.key === "Escape") onClose();
    }

    document.addEventListener("keydown", handleKey);
    document.body.style.overflow = "hidden";
    return () => {
      document.removeEventListener("keydown", handleKey);
      document.body.style.overflow = "";
    };
  }, [open, onClose]);

  useEffect(() => {
    if (!open) {
      setMode("methods");
      setStatus("idle");
      setErrorMsg(null);
      setEmail("");
    }
  }, [open]);

  if (!open) return null;

  return (
    <div
      className="fixed inset-0 z-[60] flex items-center justify-center bg-black/50 backdrop-blur-[4px]"
      onClick={onClose}
      aria-modal="true"
      role="dialog"
    >
      <div
        ref={cardRef}
        onClick={(event) => event.stopPropagation()}
        className="relative w-full max-w-[420px] rounded-[32px] bg-brand-bg-surface p-10 text-brand-text-primary-dark shadow-2xl"
      >
        <button
          type="button"
          onClick={onClose}
          aria-label="Close"
          className="absolute right-5 top-5 grid h-9 w-9 place-items-center rounded-xl text-brand-text-secondary-dark transition hover:bg-brand-bg-elevated hover:text-brand-text-primary-dark"
        >
          <X className="h-5 w-5" strokeWidth={1.5} />
        </button>

        <div className="flex flex-col gap-2">
          <h2 className="font-display text-[24px] font-medium leading-7">
            {mode === "methods" ? "Sign in to Boost" : "Sign in with email"}
          </h2>
          <p className="font-display text-[13px] font-medium leading-5 text-brand-text-secondary-dark">
            {mode === "methods"
              ? "Use one of the providers below to continue."
              : "We'll email you a one-time link to sign in."}
          </p>
        </div>

        {mode === "methods" ? (
          <div className="mt-8 flex flex-col gap-3">
            <MethodButton
              label="Continue with Google"
              onClick={() => signInWithProvider("google")}
              icon={<GoogleMark />}
            />
            <MethodButton
              label="Continue with Discord"
              onClick={() => signInWithProvider("discord")}
              icon={<DiscordMark />}
            />
            <MethodButton
              label="Continue with Email"
              onClick={() => setMode("email")}
              icon={<Mail className="h-5 w-5" strokeWidth={1.5} />}
            />
          </div>
        ) : (
          <form className="mt-8 flex flex-col gap-3" onSubmit={sendMagicLink}>
            <label className="flex h-14 items-center gap-3 rounded-2xl bg-brand-bg-elevated px-5">
              <Mail
                className="h-5 w-5 text-brand-text-secondary-dark"
                strokeWidth={1.5}
              />
              <input
                type="email"
                required
                autoFocus
                value={email}
                onChange={(event) => setEmail(event.target.value)}
                placeholder="you@example.com"
                disabled={status === "sending" || status === "sent"}
                className="flex-1 bg-transparent font-display text-[14px] font-medium text-brand-text-primary-dark placeholder:text-brand-text-secondary-dark focus:outline-none disabled:opacity-60"
              />
            </label>
            <button
              type="submit"
              disabled={status === "sending" || status === "sent"}
              className="inline-flex h-12 items-center justify-center rounded-2xl bg-gradient-to-b from-brand-accent to-brand-accent-dark font-display text-[13px] font-medium text-brand-text-primary-light transition hover:brightness-95 disabled:opacity-60"
            >
              {status === "sending"
                ? "Sending…"
                : status === "sent"
                  ? "Check your email"
                  : "Send magic link"}
            </button>
            {status === "sent" ? (
              <p className="font-display text-[12px] leading-4 text-brand-text-secondary-dark">
                We sent a sign-in link to {email}.
              </p>
            ) : null}
            <button
              type="button"
              onClick={() => setMode("methods")}
              className="mt-1 font-display text-[12px] font-medium text-brand-text-secondary-dark transition hover:text-brand-text-primary-dark"
            >
              ← Back to all methods
            </button>
          </form>
        )}

        {errorMsg ? (
          <p className="mt-4 font-display text-[12px] leading-4 text-brand-discount">
            {errorMsg}
          </p>
        ) : null}

        <p className="mt-8 font-display text-[11px] leading-4 text-brand-text-secondary-dark">
          By continuing you agree to the Terms of Service and Privacy Policy.
        </p>
      </div>
    </div>
  );
}

function MethodButton({
  label,
  icon,
  onClick,
}: {
  label: string;
  icon: React.ReactNode;
  onClick: () => void;
}) {
  return (
    <button
      type="button"
      onClick={onClick}
      className={cn(
        "flex h-14 items-center gap-3 rounded-2xl bg-brand-bg-elevated px-5 font-display text-[14px] font-medium text-brand-text-primary-dark transition hover:bg-brand-border",
      )}
    >
      <span className="grid h-6 w-6 place-items-center">{icon}</span>
      <span className="flex-1 text-left">{label}</span>
    </button>
  );
}

function GoogleMark() {
  return (
    <svg viewBox="0 0 24 24" className="h-5 w-5" aria-hidden>
      <path
        fill="#4285F4"
        d="M23.49 12.27c0-.79-.07-1.54-.19-2.27H12v4.51h6.44c-.28 1.43-1.11 2.64-2.35 3.46v2.88h3.79c2.22-2.05 3.61-5.08 3.61-8.58z"
      />
      <path
        fill="#34A853"
        d="M12 24c3.24 0 5.95-1.08 7.93-2.91l-3.79-2.88c-1.05.7-2.39 1.12-4.14 1.12-3.18 0-5.88-2.15-6.84-5.04H1.23v3.16C3.2 21.31 7.3 24 12 24z"
      />
      <path
        fill="#FBBC05"
        d="M5.16 14.29a7.22 7.22 0 010-4.58V6.55H1.23a12 12 0 000 10.9l3.93-3.16z"
      />
      <path
        fill="#EA4335"
        d="M12 4.75c1.77 0 3.36.61 4.61 1.8l3.46-3.46C17.95 1.19 15.24 0 12 0 7.3 0 3.2 2.69 1.23 6.55l3.93 3.16C6.12 6.9 8.82 4.75 12 4.75z"
      />
    </svg>
  );
}

function DiscordMark() {
  return (
    <svg viewBox="0 0 24 24" className="h-5 w-5" aria-hidden>
      <path
        fill="#5865F2"
        d="M20.317 4.369A19.79 19.79 0 0015.432 2.854a.074.074 0 00-.079.037c-.21.375-.445.865-.608 1.25a18.27 18.27 0 00-5.487 0 12.65 12.65 0 00-.618-1.25.077.077 0 00-.078-.037A19.74 19.74 0 003.677 4.37a.07.07 0 00-.032.027C.533 9.046-.32 13.58.099 18.058a.082.082 0 00.031.056 19.9 19.9 0 005.993 3.03.078.078 0 00.084-.028c.462-.63.873-1.295 1.226-1.994a.076.076 0 00-.042-.106 13.1 13.1 0 01-1.872-.892.077.077 0 01-.008-.128c.126-.094.252-.192.372-.291a.074.074 0 01.078-.011c3.928 1.793 8.18 1.793 12.062 0a.074.074 0 01.078.01c.12.099.247.198.374.292a.077.077 0 01-.006.128c-.598.349-1.22.643-1.873.891a.076.076 0 00-.041.107c.36.698.772 1.362 1.225 1.993a.076.076 0 00.084.028 19.84 19.84 0 006.002-3.03.077.077 0 00.031-.055c.5-5.177-.838-9.674-3.549-13.66a.061.061 0 00-.031-.028zM8.02 15.331c-1.183 0-2.157-1.085-2.157-2.419s.956-2.419 2.157-2.419c1.21 0 2.176 1.095 2.157 2.42 0 1.333-.956 2.418-2.157 2.418zm7.975 0c-1.183 0-2.157-1.085-2.157-2.419s.955-2.419 2.157-2.419c1.21 0 2.176 1.095 2.157 2.42 0 1.333-.947 2.418-2.157 2.418z"
      />
    </svg>
  );
}
