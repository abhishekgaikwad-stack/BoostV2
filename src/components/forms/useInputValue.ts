"use client";

import { useEffect, useState } from "react";

/**
 * Mirrors an uncontrolled-from-the-parent input's current value into
 * React state. Useful when the input is controlled internally by a
 * wrapper component (e.g. DecimalInput) that doesn't bubble onChange to
 * the parent. Listens for the native `input` event on the ref'd
 * element.
 */
export function useInputValue(
  ref: React.RefObject<HTMLInputElement | null>,
): string {
  const [value, setValue] = useState("");

  useEffect(() => {
    const el = ref.current;
    if (!el) return;
    const sync = () => setValue(el.value);
    sync();
    el.addEventListener("input", sync);
    return () => el.removeEventListener("input", sync);
  }, [ref]);

  return value;
}
