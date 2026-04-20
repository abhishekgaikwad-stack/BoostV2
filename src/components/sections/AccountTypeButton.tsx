"use client";

import { ArrowRight } from "lucide-react";
import { useState } from "react";
import { AccountTypePopup } from "@/components/sections/AccountTypePopup";

export function AccountTypeButton({
  isSeller,
  label,
}: {
  isSeller: boolean;
  label: string;
}) {
  const [open, setOpen] = useState(false);
  return (
    <>
      <button
        type="button"
        onClick={() => setOpen(true)}
        className="inline-flex h-10 w-fit items-center gap-2 rounded-lg bg-black px-3 font-display text-[14px] font-medium leading-6 text-white transition hover:bg-brand-bg-elevated"
      >
        {label}
        <ArrowRight className="h-4 w-4" strokeWidth={1.5} />
      </button>
      <AccountTypePopup
        open={open}
        onClose={() => setOpen(false)}
        currentIsSeller={isSeller}
      />
    </>
  );
}
