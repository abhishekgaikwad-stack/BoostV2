"use client";

import { Check } from "lucide-react";
import { usePathname, useRouter, useSearchParams } from "next/navigation";
import { useEffect, useState } from "react";
import { cn } from "@/lib/utils";

type ToastState = "hidden" | "visible" | "leaving";

const VISIBLE_MS = 5000;
const EXIT_MS = 400; // a hair longer than the 0.35s CSS exit

/**
 * Dark-themed bottom-right snackbar shown after a successful sign-in.
 *
 * Trigger: the `/api/auth/callback` route appends `auth=success` to the
 * post-login URL on a clean code-exchange. This component watches for that
 * flag, runs a bouncy slide-in-from-top animation, holds for 5s, then slides
 * out down and unmounts. The flag is stripped via `router.replace` so a
 * refresh doesn't re-fire.
 */
export function LoginSuccessToast() {
  const searchParams = useSearchParams();
  const pathname = usePathname();
  const router = useRouter();
  const [state, setState] = useState<ToastState>("hidden");

  // Fire on `?auth=success`.
  useEffect(() => {
    if (searchParams.get("auth") !== "success") return;

    setState("visible");

    const params = new URLSearchParams(searchParams.toString());
    params.delete("auth");
    const qs = params.toString();
    router.replace(qs ? `${pathname}?${qs}` : pathname, { scroll: false });

    const toLeaving = window.setTimeout(
      () => setState("leaving"),
      VISIBLE_MS,
    );
    return () => window.clearTimeout(toLeaving);
  }, [searchParams, pathname, router]);

  // After the exit animation plays, unmount so a future trigger gets a fresh
  // enter animation.
  useEffect(() => {
    if (state !== "leaving") return;
    const toHidden = window.setTimeout(() => setState("hidden"), EXIT_MS);
    return () => window.clearTimeout(toHidden);
  }, [state]);

  if (state === "hidden") return null;

  return (
    <div
      role="status"
      aria-live="polite"
      className={cn(
        "pointer-events-none fixed bottom-6 right-6 z-50 flex items-center gap-3 rounded-2xl border border-brand-border-subtle bg-brand-bg-surface px-4 py-3 shadow-2xl",
        state === "leaving" ? "animate-snackbar-out" : "animate-snackbar-in",
      )}
    >
      <span className="grid h-8 w-8 shrink-0 place-items-center rounded-full bg-brand-success text-white">
        <Check className="h-4 w-4" strokeWidth={2.5} />
      </span>
      <span className="whitespace-nowrap font-display text-[13px] font-medium leading-4 text-brand-text-primary-dark">
        Signed in successfully
      </span>
    </div>
  );
}
