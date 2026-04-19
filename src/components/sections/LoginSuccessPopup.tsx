"use client";

import { CheckCircle2 } from "lucide-react";
import { useRouter } from "next/navigation";
import { useEffect, useState } from "react";

export function LoginSuccessPopup() {
  const router = useRouter();
  const [open, setOpen] = useState(true);

  useEffect(() => {
    if (!open) return;

    function handleKey(event: KeyboardEvent) {
      if (event.key === "Escape") handleClose();
    }

    document.addEventListener("keydown", handleKey);
    document.body.style.overflow = "hidden";
    return () => {
      document.removeEventListener("keydown", handleKey);
      document.body.style.overflow = "";
    };
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [open]);

  function handleClose() {
    setOpen(false);
    router.replace("/profile");
  }

  if (!open) return null;

  return (
    <div
      className="fixed inset-0 z-[60] flex items-center justify-center bg-black/50 backdrop-blur-[4px]"
      aria-modal="true"
      role="dialog"
    >
      <div className="relative flex w-full max-w-[400px] flex-col items-center gap-4 rounded-[32px] bg-brand-bg-surface p-10 text-center text-brand-text-primary-dark shadow-2xl">
        <span className="grid h-14 w-14 place-items-center rounded-full bg-brand-accent/20 text-brand-accent">
          <CheckCircle2 className="h-7 w-7" strokeWidth={2} />
        </span>
        <h2 className="font-display text-[20px] font-bold leading-6">
          Login successful
        </h2>
        <p className="font-display text-[13px] font-medium leading-5 text-brand-text-secondary-dark">
          You're all set. Click OK to head to your profile.
        </p>
        <button
          type="button"
          onClick={handleClose}
          autoFocus
          className="mt-2 inline-flex h-11 w-full items-center justify-center rounded-2xl bg-gradient-to-b from-brand-accent to-brand-accent-dark font-display text-[13px] font-medium text-brand-text-primary-light transition hover:brightness-95"
        >
          OK
        </button>
      </div>
    </div>
  );
}
