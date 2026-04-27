"use client";

import { Eye } from "lucide-react";
import { useState } from "react";
import { RevealOrderDetailsDialog } from "@/components/sections/RevealOrderDetailsDialog";
import type { Order } from "@/lib/orders";

export function RevealOrderDetailsButton({ order }: { order: Order }) {
  const [open, setOpen] = useState(false);
  const isAlreadyRevealed = Boolean(order.revealedAt);
  const label = isAlreadyRevealed ? "View order details" : "Reveal order details";

  return (
    <>
      <button
        type="button"
        onClick={() => setOpen(true)}
        className="inline-flex h-12 items-center justify-center gap-2 rounded-2xl border border-brand-border-light bg-white font-display text-[14px] font-medium text-brand-text-primary-light transition hover:bg-brand-bg-light"
      >
        <Eye className="h-4 w-4" strokeWidth={1.75} />
        {label}
      </button>
      <RevealOrderDetailsDialog
        order={order}
        open={open}
        onClose={() => setOpen(false)}
      />
    </>
  );
}
