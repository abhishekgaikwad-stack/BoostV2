"use client";

import { useState } from "react";
import { BulkListingUpload } from "@/components/sections/BulkListingUpload";
import { CreateListingForm } from "@/components/sections/CreateListingForm";
import { cn } from "@/lib/utils";
import type { Game } from "@/types";

type Tab = "manual" | "bulk";

export function SellTabs({ games }: { games: Game[] }) {
  const [active, setActive] = useState<Tab>("manual");

  return (
    <div className="flex flex-col gap-6">
      <div
        role="tablist"
        className="flex gap-6 border-b border-brand-border-light"
      >
        <TabButton
          label="Manual"
          active={active === "manual"}
          onClick={() => setActive("manual")}
        />
        <TabButton
          label="Bulk upload"
          active={active === "bulk"}
          onClick={() => setActive("bulk")}
        />
      </div>

      {active === "manual" ? (
        <CreateListingForm games={games} />
      ) : (
        <BulkListingUpload games={games} />
      )}
    </div>
  );
}

function TabButton({
  label,
  active,
  onClick,
}: {
  label: string;
  active: boolean;
  onClick: () => void;
}) {
  return (
    <button
      type="button"
      role="tab"
      aria-selected={active}
      onClick={onClick}
      className={cn(
        "relative pb-3 font-display text-[14px] font-medium transition",
        active
          ? "text-brand-text-primary-light after:absolute after:bottom-0 after:left-0 after:right-0 after:h-0.5 after:bg-brand-accent-dark"
          : "text-brand-text-secondary-light hover:text-brand-text-primary-light",
      )}
    >
      {label}
    </button>
  );
}
