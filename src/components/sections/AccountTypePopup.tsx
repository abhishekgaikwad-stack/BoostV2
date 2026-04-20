"use client";

import { ShoppingBag, Tag, X } from "lucide-react";
import { useRouter } from "next/navigation";
import { useEffect, useState } from "react";
import { cn } from "@/lib/utils";

type Pending = "buyer" | "seller" | null;

export function AccountTypePopup({
  open,
  onClose,
  currentIsSeller,
}: {
  open: boolean;
  onClose: () => void;
  currentIsSeller: boolean;
}) {
  const router = useRouter();
  const [pending, setPending] = useState<Pending>(null);
  const [errorMsg, setErrorMsg] = useState<string | null>(null);

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
      setPending(null);
      setErrorMsg(null);
    }
  }, [open]);

  async function setAccountType(isSeller: boolean) {
    setPending(isSeller ? "seller" : "buyer");
    setErrorMsg(null);
    try {
      const res = await fetch("/api/profile/account-type", {
        method: "PATCH",
        headers: { "content-type": "application/json" },
        body: JSON.stringify({ isSeller }),
      });
      if (!res.ok) {
        const { error } = await res.json().catch(() => ({}));
        throw new Error(error ?? "Could not update account type");
      }
      router.refresh();
      onClose();
    } catch (err) {
      setErrorMsg(err instanceof Error ? err.message : "Update failed");
    } finally {
      setPending(null);
    }
  }

  if (!open) return null;

  return (
    <div
      className="fixed inset-0 z-[60] flex items-center justify-center bg-black/50 backdrop-blur-[4px]"
      onClick={onClose}
      aria-modal="true"
      role="dialog"
    >
      <div
        onClick={(event) => event.stopPropagation()}
        className="relative w-full max-w-[440px] rounded-[32px] bg-brand-bg-surface p-10 text-brand-text-primary-dark shadow-2xl"
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
            Account type
          </h2>
          <p className="font-display text-[13px] font-medium leading-5 text-brand-text-secondary-dark">
            Choose how you use Boost. You can switch anytime.
          </p>
        </div>

        <div className="mt-8 flex flex-col gap-3">
          <OptionButton
            icon={<ShoppingBag className="h-5 w-5" strokeWidth={1.5} />}
            title="Buyer account"
            subtitle="Purchase accounts from trusted sellers."
            selected={!currentIsSeller}
            pending={pending === "buyer"}
            onClick={() => setAccountType(false)}
          />
          <OptionButton
            icon={<Tag className="h-5 w-5" strokeWidth={1.5} />}
            title="Seller account"
            subtitle="List and sell your accounts to earn."
            selected={currentIsSeller}
            pending={pending === "seller"}
            onClick={() => setAccountType(true)}
          />
        </div>

        {errorMsg ? (
          <p className="mt-4 font-display text-[12px] leading-4 text-brand-discount">
            {errorMsg}
          </p>
        ) : null}
      </div>
    </div>
  );
}

function OptionButton({
  icon,
  title,
  subtitle,
  selected,
  pending,
  onClick,
}: {
  icon: React.ReactNode;
  title: string;
  subtitle: string;
  selected: boolean;
  pending: boolean;
  onClick: () => void;
}) {
  return (
    <button
      type="button"
      onClick={onClick}
      disabled={selected || pending}
      className={cn(
        "flex items-center gap-4 rounded-2xl border p-5 text-left transition",
        selected
          ? "border-brand-accent bg-brand-accent/10"
          : "border-brand-border-subtle bg-brand-bg-elevated hover:bg-brand-border",
        pending && "opacity-60",
      )}
    >
      <span className="grid h-10 w-10 place-items-center rounded-xl bg-brand-bg-surface">
        {icon}
      </span>
      <span className="flex flex-1 flex-col">
        <span className="font-display text-[14px] font-medium leading-5">
          {title}
        </span>
        <span className="font-display text-[12px] font-medium leading-4 text-brand-text-secondary-dark">
          {subtitle}
        </span>
      </span>
      {selected ? (
        <span className="rounded-md bg-brand-accent px-2 py-1 font-display text-[10px] font-bold text-brand-text-primary-light">
          CURRENT
        </span>
      ) : null}
    </button>
  );
}
