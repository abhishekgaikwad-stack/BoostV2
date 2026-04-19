import { ArrowLeft, ArrowRight } from "lucide-react";
import { cn } from "@/lib/utils";

export function CarouselNav({
  tone = "dark",
  className,
}: {
  tone?: "dark" | "light";
  className?: string;
}) {
  const base =
    "grid h-10 w-10 place-items-center rounded-xl transition disabled:opacity-40";
  const toneClass =
    tone === "dark"
      ? "bg-brand-bg-elevated text-brand-text-primary-dark hover:bg-brand-border"
      : "bg-brand-bg-pill text-brand-text-primary-light hover:bg-brand-border-light";

  return (
    <div className={cn("flex items-center gap-2", className)}>
      <button
        type="button"
        aria-label="Previous"
        className={cn(base, toneClass)}
      >
        <ArrowLeft className="h-5 w-5" strokeWidth={1.5} />
      </button>
      <button type="button" aria-label="Next" className={cn(base, toneClass)}>
        <ArrowRight className="h-5 w-5" strokeWidth={1.5} />
      </button>
    </div>
  );
}
