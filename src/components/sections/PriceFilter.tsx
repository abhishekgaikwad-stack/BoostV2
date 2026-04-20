"use client";

import { ChevronDown } from "lucide-react";
import { useEffect, useMemo, useRef, useState } from "react";
import { cn } from "@/lib/utils";

export function PriceFilter({
  min,
  max,
  value,
  onChange,
  currency = "€",
}: {
  min: number;
  max: number;
  value: [string, string];
  onChange: (min: string, max: string) => void;
  currency?: string;
}) {
  const [open, setOpen] = useState(false);
  const wrapperRef = useRef<HTMLDivElement | null>(null);

  useEffect(() => {
    if (!open) return;
    function handlePointerDown(event: MouseEvent) {
      if (
        wrapperRef.current &&
        !wrapperRef.current.contains(event.target as Node)
      ) {
        setOpen(false);
      }
    }
    function handleKey(event: KeyboardEvent) {
      if (event.key === "Escape") setOpen(false);
    }
    document.addEventListener("mousedown", handlePointerDown);
    document.addEventListener("keydown", handleKey);
    return () => {
      document.removeEventListener("mousedown", handlePointerDown);
      document.removeEventListener("keydown", handleKey);
    };
  }, [open]);

  const [localMin, localMax] = value;

  // Resolved numeric values for the slider (fall back to bounds when empty)
  const minNum = useMemo(() => clamp(Number.parseFloat(localMin) || min, min, max), [
    localMin,
    min,
    max,
  ]);
  const maxNum = useMemo(() => clamp(Number.parseFloat(localMax) || max, min, max), [
    localMax,
    min,
    max,
  ]);

  const label =
    localMin || localMax
      ? `${currency}${localMin || min} – ${currency}${localMax || max}`
      : "Any price";

  function setMin(v: string | number) {
    const next = String(v);
    const nextNum = clamp(Number.parseFloat(next) || min, min, maxNum);
    onChange(String(nextNum), localMax);
  }

  function setMax(v: string | number) {
    const next = String(v);
    const nextNum = clamp(Number.parseFloat(next) || max, minNum, max);
    onChange(localMin, String(nextNum));
  }

  const leftPct = ((minNum - min) / (max - min)) * 100;
  const rightPct = ((max - maxNum) / (max - min)) * 100;

  return (
    <div ref={wrapperRef} className="relative">
      <button
        type="button"
        onClick={() => setOpen((v) => !v)}
        className={cn(
          "flex h-11 min-w-[160px] items-center justify-between gap-3 rounded-xl bg-brand-bg-pill pl-4 pr-3 font-display text-[14px] font-medium text-brand-text-primary-light",
        )}
      >
        <span className="truncate">{label}</span>
        <ChevronDown
          className={cn(
            "h-4 w-4 shrink-0 text-brand-text-secondary-dark transition-transform",
            open && "rotate-180",
          )}
          strokeWidth={1.5}
        />
      </button>

      {open ? (
        <div className="absolute right-0 top-full z-20 mt-2 w-[320px] rounded-2xl border border-brand-border-light bg-white p-4 shadow-xl">
          <div className="mb-5 mt-2 flex flex-col gap-3">
            <div className="relative h-5">
              <div className="absolute left-0 right-0 top-1/2 h-1 -translate-y-1/2 rounded-full bg-brand-bg-pill" />
              <div
                className="absolute top-1/2 h-1 -translate-y-1/2 rounded-full bg-brand-accent-dark"
                style={{ left: `${leftPct}%`, right: `${rightPct}%` }}
              />
              <input
                type="range"
                min={min}
                max={max}
                step="any"
                value={minNum}
                onChange={(e) => setMin(e.target.value)}
                className="absolute inset-0 w-full appearance-none bg-transparent pointer-events-none [&::-moz-range-thumb]:h-4 [&::-moz-range-thumb]:w-4 [&::-moz-range-thumb]:cursor-pointer [&::-moz-range-thumb]:rounded-full [&::-moz-range-thumb]:border-0 [&::-moz-range-thumb]:bg-brand-accent-dark [&::-moz-range-thumb]:pointer-events-auto [&::-webkit-slider-thumb]:pointer-events-auto [&::-webkit-slider-thumb]:h-4 [&::-webkit-slider-thumb]:w-4 [&::-webkit-slider-thumb]:cursor-pointer [&::-webkit-slider-thumb]:appearance-none [&::-webkit-slider-thumb]:rounded-full [&::-webkit-slider-thumb]:bg-brand-accent-dark"
              />
              <input
                type="range"
                min={min}
                max={max}
                step="any"
                value={maxNum}
                onChange={(e) => setMax(e.target.value)}
                className="absolute inset-0 w-full appearance-none bg-transparent pointer-events-none [&::-moz-range-thumb]:h-4 [&::-moz-range-thumb]:w-4 [&::-moz-range-thumb]:cursor-pointer [&::-moz-range-thumb]:rounded-full [&::-moz-range-thumb]:border-0 [&::-moz-range-thumb]:bg-brand-accent-dark [&::-moz-range-thumb]:pointer-events-auto [&::-webkit-slider-thumb]:pointer-events-auto [&::-webkit-slider-thumb]:h-4 [&::-webkit-slider-thumb]:w-4 [&::-webkit-slider-thumb]:cursor-pointer [&::-webkit-slider-thumb]:appearance-none [&::-webkit-slider-thumb]:rounded-full [&::-webkit-slider-thumb]:bg-brand-accent-dark"
              />
            </div>
            <div className="flex justify-between font-mono text-[10px] uppercase tracking-[0.06em] text-brand-text-secondary-dark">
              <span>
                {currency}
                {min}
              </span>
              <span>
                {currency}
                {max}
              </span>
            </div>
          </div>

          <div className="flex gap-2">
            <label className="flex flex-1 flex-col gap-1">
              <span className="font-display text-[11px] font-medium text-brand-text-secondary-light">
                Min ({currency})
              </span>
              <input
                type="number"
                inputMode="decimal"
                min={min}
                max={max}
                value={localMin}
                onChange={(e) => onChange(e.target.value, localMax)}
                onBlur={(e) =>
                  e.target.value !== "" && setMin(e.target.value)
                }
                placeholder={String(min)}
                className="h-10 rounded-lg bg-brand-bg-pill px-3 font-display text-[14px] font-medium text-brand-text-primary-light placeholder:text-brand-text-tertiary-dark focus:outline-none [appearance:textfield] [&::-webkit-inner-spin-button]:appearance-none [&::-webkit-outer-spin-button]:appearance-none"
              />
            </label>
            <label className="flex flex-1 flex-col gap-1">
              <span className="font-display text-[11px] font-medium text-brand-text-secondary-light">
                Max ({currency})
              </span>
              <input
                type="number"
                inputMode="decimal"
                min={min}
                max={max}
                value={localMax}
                onChange={(e) => onChange(localMin, e.target.value)}
                onBlur={(e) =>
                  e.target.value !== "" && setMax(e.target.value)
                }
                placeholder={String(max)}
                className="h-10 rounded-lg bg-brand-bg-pill px-3 font-display text-[14px] font-medium text-brand-text-primary-light placeholder:text-brand-text-tertiary-dark focus:outline-none [appearance:textfield] [&::-webkit-inner-spin-button]:appearance-none [&::-webkit-outer-spin-button]:appearance-none"
              />
            </label>
          </div>

          <div className="mt-4 flex items-center justify-between">
            <button
              type="button"
              onClick={() => onChange("", "")}
              className="font-display text-[12px] font-medium text-brand-text-secondary-light transition hover:text-brand-text-primary-light"
            >
              Clear
            </button>
            <button
              type="button"
              onClick={() => setOpen(false)}
              className="rounded-lg bg-black px-3 py-2 font-display text-[12px] font-medium text-white transition hover:bg-brand-bg-surface"
            >
              Done
            </button>
          </div>
        </div>
      ) : null}
    </div>
  );
}

function clamp(v: number, min: number, max: number) {
  return Math.min(Math.max(v, min), max);
}
