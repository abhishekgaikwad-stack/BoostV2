"use client";

import { forwardRef, useState } from "react";

type Props = Omit<
  React.InputHTMLAttributes<HTMLInputElement>,
  "type" | "value" | "defaultValue" | "onChange" | "max"
> & {
  defaultValue?: string;
  /** Controlled value. If provided (even ""), the parent owns state and
   *  must update it via `onValueChange`. */
  value?: string;
  /** Called with the next value whenever a keystroke (or paste) is
   *  accepted. Compatible with both controlled and uncontrolled modes. */
  onValueChange?: (value: string) => void;
  /** Maximum digits after the decimal point. Defaults to 2. */
  decimals?: number;
  /** If set, keystrokes that would produce a value above `max` are rejected. */
  max?: number;
};

/**
 * Numeric text input that silently refuses keystrokes (or pastes) that
 * would produce more than `decimals` digits after the decimal point.
 * Renders as `type="text"` with `inputMode="decimal"` so mobile keyboards
 * still show the numeric pad.
 *
 * Supports both modes:
 *  - **Uncontrolled:** pass `defaultValue` (or nothing) and read the
 *    final value from the form submission. Optionally subscribe via
 *    `onValueChange` for live previews without taking over state.
 *  - **Controlled:** pass `value` + `onValueChange` for full external
 *    control. Use this when a sibling needs the current value (e.g. a
 *    payout/commission preview), so we have a single source of truth
 *    and avoid the controlled-input race that breaks via DOM listeners.
 */
export const DecimalInput = forwardRef<HTMLInputElement, Props>(
  function DecimalInput(
    {
      defaultValue = "",
      value: controlledValue,
      onValueChange,
      decimals = 2,
      max,
      ...rest
    },
    ref,
  ) {
    const isControlled = controlledValue !== undefined;
    const [uncontrolledValue, setUncontrolledValue] = useState(defaultValue);
    const value = isControlled ? controlledValue : uncontrolledValue;

    // Matches optional leading digits, optional dot, and up to `decimals`
    // digits after. Also allows an in-progress "12." (trailing dot) so the
    // user can type the fractional part character-by-character.
    const pattern = new RegExp(`^\\d*(\\.\\d{0,${decimals}})?$`);

    return (
      <input
        ref={ref}
        type="text"
        inputMode="decimal"
        autoComplete="off"
        value={value}
        onChange={(event) => {
          const raw = event.target.value;
          if (raw !== "" && !pattern.test(raw)) return;
          if (max != null && raw !== "" && raw !== ".") {
            const num = Number.parseFloat(raw);
            if (Number.isFinite(num) && num > max) return;
          }
          if (!isControlled) setUncontrolledValue(raw);
          onValueChange?.(raw);
        }}
        {...rest}
      />
    );
  },
);
