"use client";

import { useEffect, useState } from "react";

/**
 * Tracks the current value length of an uncontrolled input/textarea via its
 * ref. Cheap to wire into existing forms — keeps the input uncontrolled,
 * just listens for `input` events.
 */
export function useCharLength(
  ref: React.RefObject<HTMLInputElement | HTMLTextAreaElement | null>,
): number {
  const [length, setLength] = useState(0);

  useEffect(() => {
    const el = ref.current;
    if (!el) return;
    const sync = () => setLength(el.value.length);
    sync();
    el.addEventListener("input", sync);
    return () => el.removeEventListener("input", sync);
  }, [ref]);

  return length;
}

/**
 * Renders a "<length>/<max>" hint in the discount-red colour, **only when
 * the limit has been breached**. By design there's no UI under the limit —
 * the form looks clean until the seller actually goes over.
 */
export function CharCounter({
  length,
  max,
}: {
  length: number;
  max: number;
}) {
  if (length <= max) return null;
  return (
    <span className="self-end font-display text-[11px] font-medium text-brand-discount">
      {length}/{max}
    </span>
  );
}
