"use client";

import { useCallback, useRef, useState } from "react";

/**
 * Hook for the seller listing forms. Owns controlled platform/region state
 * (so they can render as inputs and serialize via FormData), plus refs to
 * the uncontrolled title + description fields. Exposes an onBlur handler
 * for those fields — when fired, if title or description has content and
 * at least one of platform/region is empty, hits /api/ai/detect-listing-attrs
 * and fills only the empty target fields. Manual values are never
 * overwritten.
 */
export function useAutoDetectListingAttrs(initial?: {
  platform?: string | null;
  region?: string | null;
}) {
  const [platform, setPlatform] = useState(initial?.platform ?? "");
  const [region, setRegion] = useState(initial?.region ?? "");
  const [detecting, setDetecting] = useState(false);

  const titleRef = useRef<HTMLInputElement | null>(null);
  const descriptionRef = useRef<HTMLTextAreaElement | null>(null);
  // Avoid stacking concurrent fetches if both fields blur in quick succession.
  const inFlightRef = useRef(false);

  const maybeDetect = useCallback(async () => {
    if (inFlightRef.current) return;

    const titleVal = titleRef.current?.value.trim() ?? "";
    const descVal = descriptionRef.current?.value.trim() ?? "";
    if (titleVal.length === 0 && descVal.length === 0) return;

    // Skip when both targets are already populated — manual values stay put.
    if (platform.trim().length > 0 && region.trim().length > 0) return;

    inFlightRef.current = true;
    setDetecting(true);
    try {
      const res = await fetch("/api/ai/detect-listing-attrs", {
        method: "POST",
        headers: { "content-type": "application/json" },
        body: JSON.stringify({ title: titleVal, description: descVal }),
      });
      if (!res.ok) return;
      const data = (await res.json()) as {
        platform: string | null;
        region: string | null;
      };
      setPlatform((prev) =>
        prev.trim().length > 0 ? prev : data.platform ?? prev,
      );
      setRegion((prev) =>
        prev.trim().length > 0 ? prev : data.region ?? prev,
      );
    } catch {
      // Silently swallow — auto-detect is best-effort, the seller can still
      // fill manually.
    } finally {
      inFlightRef.current = false;
      setDetecting(false);
    }
  }, [platform, region]);

  return {
    platform,
    region,
    setPlatform,
    setRegion,
    detecting,
    titleRef,
    descriptionRef,
    onAutoDetectBlur: maybeDetect,
  };
}
