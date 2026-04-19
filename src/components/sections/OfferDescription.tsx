"use client";

import { ChevronUp } from "lucide-react";
import { useState } from "react";

export function OfferDescription({ description }: { description: string }) {
  const [expanded, setExpanded] = useState(false);

  return (
    <section className="flex flex-col gap-4">
      <h2 className="font-display text-[16px] font-medium leading-5 text-brand-text-primary-light">
        Description
      </h2>
      <div
        className={
          expanded
            ? "font-display text-[12px] font-medium leading-4 text-brand-text-secondary-dark whitespace-pre-line"
            : "font-display text-[12px] font-medium leading-4 text-brand-text-secondary-dark whitespace-pre-line line-clamp-[12]"
        }
      >
        {description}
      </div>
      <button
        type="button"
        onClick={() => setExpanded((v) => !v)}
        className="inline-flex h-12 w-fit items-center gap-2 rounded-xl border border-[#dedede] bg-transparent px-5 font-display text-[14px] font-medium text-brand-text-primary-light transition hover:bg-brand-bg-light"
      >
        {expanded ? "Show less" : "Show more"}
        <ChevronUp
          className={`h-5 w-5 transition-transform ${expanded ? "" : "rotate-180"}`}
          strokeWidth={1.5}
        />
      </button>
    </section>
  );
}
