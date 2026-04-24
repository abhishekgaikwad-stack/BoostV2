"use client";

import { Check } from "lucide-react";
import { usePathname, useRouter, useSearchParams } from "next/navigation";
import { useEffect, useState } from "react";

/**
 * Renders a bottom-right snackbar after a successful login. Listens for the
 * `auth=success` query param that `/api/auth/callback` appends on a good
 * code-exchange, then strips it so a refresh doesn't re-show.
 */
export function LoginSuccessToast() {
  const searchParams = useSearchParams();
  const pathname = usePathname();
  const router = useRouter();
  const [visible, setVisible] = useState(false);

  useEffect(() => {
    if (searchParams.get("auth") !== "success") return;

    setVisible(true);

    // Clear the flag from the URL so refresh / back-nav doesn't retrigger.
    const params = new URLSearchParams(searchParams.toString());
    params.delete("auth");
    const qs = params.toString();
    router.replace(qs ? `${pathname}?${qs}` : pathname, { scroll: false });

    const handle = window.setTimeout(() => setVisible(false), 3000);
    return () => window.clearTimeout(handle);
  }, [searchParams, pathname, router]);

  if (!visible) return null;

  return (
    <div
      role="status"
      aria-live="polite"
      className="pointer-events-none fixed bottom-6 right-6 z-50 flex items-center gap-3 rounded-2xl border border-brand-border-light bg-white px-4 py-3 shadow-xl"
    >
      <span className="grid h-8 w-8 shrink-0 place-items-center rounded-full bg-brand-success text-white">
        <Check className="h-4 w-4" strokeWidth={2.5} />
      </span>
      <span className="font-display text-[13px] font-medium leading-4 text-brand-text-primary-light whitespace-nowrap">
        Signed in successfully
      </span>
    </div>
  );
}
