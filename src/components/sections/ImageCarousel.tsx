"use client";

import { ChevronLeft, ChevronRight } from "lucide-react";
import Image from "next/image";
import { useState } from "react";

/**
 * One-image-at-a-time carousel for listing screenshots, with a sliding
 * track. Arrows render only when there's more than one image, overlaid
 * directly on the picture. No thumbnail strip, no dots — by design.
 *
 * Pattern: a flex track 5×parent-wide that translates by -index*100%.
 * The parent owns relative + overflow-hidden + aspect ratio so this
 * component just lays out children.
 */
export function ImageCarousel({
  images,
  alt,
}: {
  images: string[];
  alt: string;
}) {
  const [index, setIndex] = useState(0);
  const count = images.length;
  if (count === 0) return null;

  const showArrows = count > 1;
  const sizes = "(min-width: 768px) 60vw, 100vw";

  return (
    <>
      <div
        className="flex h-full w-full transition-transform duration-300 ease-out"
        style={{ transform: `translate3d(-${index * 100}%, 0, 0)` }}
      >
        {images.map((src, i) => (
          <div key={src} className="relative h-full w-full shrink-0">
            <Image
              src={src}
              alt={alt}
              fill
              sizes={sizes}
              className="object-cover"
              priority={i === 0}
            />
          </div>
        ))}
      </div>
      {showArrows ? (
        <>
          <button
            type="button"
            aria-label="Previous image"
            onClick={() => setIndex((i) => (i - 1 + count) % count)}
            className="absolute left-3 top-1/2 z-10 grid h-10 w-10 -translate-y-1/2 place-items-center rounded-full bg-black/60 text-white transition hover:bg-black/80"
          >
            <ChevronLeft className="h-5 w-5" strokeWidth={2} />
          </button>
          <button
            type="button"
            aria-label="Next image"
            onClick={() => setIndex((i) => (i + 1) % count)}
            className="absolute right-3 top-1/2 z-10 grid h-10 w-10 -translate-y-1/2 place-items-center rounded-full bg-black/60 text-white transition hover:bg-black/80"
          >
            <ChevronRight className="h-5 w-5" strokeWidth={2} />
          </button>
        </>
      ) : null}
    </>
  );
}
