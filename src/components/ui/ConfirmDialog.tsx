"use client";

import { useEffect, useRef } from "react";
import { cn } from "@/lib/utils";

type Props = {
  open: boolean;
  onClose: () => void;
  title: string;
  description?: string;
  confirmLabel: string;
  cancelLabel?: string;
  destructive?: boolean;
  pending?: boolean;
  error?: string | null;
  onConfirm: () => void;
};

/**
 * Reusable confirmation modal. Escape + backdrop click dismiss unless
 * `pending` is true (so a destructive action in flight can't be closed
 * half-way). Cancel is focused by default — safer for destructive flows.
 */
export function ConfirmDialog({
  open,
  onClose,
  title,
  description,
  confirmLabel,
  cancelLabel = "Cancel",
  destructive = false,
  pending = false,
  error,
  onConfirm,
}: Props) {
  const cancelRef = useRef<HTMLButtonElement | null>(null);

  useEffect(() => {
    if (!open) return;

    function handleKey(event: KeyboardEvent) {
      if (event.key === "Escape" && !pending) onClose();
    }

    document.addEventListener("keydown", handleKey);
    document.body.style.overflow = "hidden";
    cancelRef.current?.focus();
    return () => {
      document.removeEventListener("keydown", handleKey);
      document.body.style.overflow = "";
    };
  }, [open, onClose, pending]);

  if (!open) return null;

  return (
    <div
      role="dialog"
      aria-modal="true"
      aria-labelledby="confirm-dialog-title"
      aria-describedby={description ? "confirm-dialog-description" : undefined}
      onClick={pending ? undefined : onClose}
      className="fixed inset-0 z-[70] flex items-center justify-center bg-black/50 p-4 backdrop-blur-[4px]"
    >
      <div
        onClick={(event) => event.stopPropagation()}
        className="w-full max-w-[420px] rounded-[28px] bg-white p-8 shadow-2xl"
      >
        <h2
          id="confirm-dialog-title"
          className="font-display text-[20px] font-medium leading-6 text-brand-text-primary-light"
        >
          {title}
        </h2>
        {description ? (
          <p
            id="confirm-dialog-description"
            className="mt-2 font-display text-[13px] leading-5 text-brand-text-secondary-light"
          >
            {description}
          </p>
        ) : null}
        {error ? (
          <p className="mt-3 font-display text-[12px] font-medium text-brand-discount">
            {error}
          </p>
        ) : null}
        <div className="mt-6 flex items-center justify-end gap-2">
          <button
            ref={cancelRef}
            type="button"
            onClick={onClose}
            disabled={pending}
            className="inline-flex h-10 items-center rounded-xl border border-brand-border-light bg-white px-4 font-display text-[13px] font-medium text-brand-text-primary-light transition hover:bg-brand-bg-light disabled:opacity-60"
          >
            {cancelLabel}
          </button>
          <button
            type="button"
            onClick={onConfirm}
            disabled={pending}
            className={cn(
              "inline-flex h-10 items-center rounded-xl px-4 font-display text-[13px] font-medium transition disabled:opacity-60",
              destructive
                ? "bg-brand-discount text-white hover:brightness-95"
                : "bg-gradient-to-b from-brand-accent to-brand-accent-dark text-brand-text-primary-light hover:brightness-95",
            )}
          >
            {pending ? `${confirmLabel}…` : confirmLabel}
          </button>
        </div>
      </div>
    </div>
  );
}
