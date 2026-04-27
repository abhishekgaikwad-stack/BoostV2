"use client";

import { useEffect, useState } from "react";

type Format = "datetime" | "date";

const formats: Record<Format, Intl.DateTimeFormatOptions> = {
  datetime: {
    day: "2-digit",
    month: "short",
    year: "numeric",
    hour: "2-digit",
    minute: "2-digit",
  },
  date: { day: "2-digit", month: "short", year: "numeric" },
};

/**
 * Renders an ISO timestamp in the buyer's local timezone. Server render and
 * client first paint both use UTC (so the HTML matches and there's no
 * hydration mismatch); a useEffect on mount swaps to the browser's TZ.
 */
export function LocalDate({
  iso,
  format = "datetime",
}: {
  iso: string;
  format?: Format;
}) {
  const opts = formats[format];
  const [text, setText] = useState(() =>
    new Date(iso).toLocaleString("en-GB", { ...opts, timeZone: "UTC" }),
  );

  useEffect(() => {
    setText(new Date(iso).toLocaleString("en-GB", opts));
    // `opts` comes from a stable lookup keyed by `format`, so it's safe to
    // omit from the dep list — re-running only on `iso` change is enough.
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [iso, format]);

  return <>{text}</>;
}
