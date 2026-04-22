"use client";

import { forwardRef, useState } from "react";

type Props = Omit<
  React.InputHTMLAttributes<HTMLInputElement>,
  "type" | "value" | "defaultValue" | "onChange"
> & {
  defaultValue?: string;
  /** Maximum digits after the decimal point. Defaults to 2. */
  decimals?: number;
};

/**
 * Controlled numeric input that silently refuses keystrokes (or pastes) that
 * would produce more than `decimals` digits after the decimal point. Renders
 * as a text input with `inputMode="decimal"` so mobile keyboards still show
 * the numeric pad.
 *
 * Prefer this over `<input type="number" step="0.01">` when you want to
 * prevent the invalid value from ever reaching the form, instead of relying
 * on browser-level validation errors at submit time.
 */
export const DecimalInput = forwardRef<HTMLInputElement, Props>(
  function DecimalInput({ defaultValue = "", decimals = 2, ...rest }, ref) {
    const [value, setValue] = useState(defaultValue);
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
          if (raw === "" || pattern.test(raw)) {
            setValue(raw);
          }
        }}
        {...rest}
      />
    );
  },
);
