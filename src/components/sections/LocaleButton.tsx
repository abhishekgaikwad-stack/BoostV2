"use client";

import { useState } from "react";
import { RegionPopup } from "@/components/sections/RegionPopup";

export function LocaleButton({
  label,
  className,
}: {
  label: string;
  className?: string;
}) {
  const [open, setOpen] = useState(false);
  return (
    <>
      <button
        type="button"
        onClick={() => setOpen(true)}
        aria-haspopup="dialog"
        aria-expanded={open}
        className={className}
      >
        {label}
      </button>
      <RegionPopup open={open} onClose={() => setOpen(false)} />
    </>
  );
}
