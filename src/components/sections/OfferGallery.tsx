import Image from "next/image";
import type { Offer } from "@/types";
import { ImageCarousel } from "@/components/sections/ImageCarousel";
import { gameImage } from "@/lib/images";

export function OfferGallery({ offer }: { offer: Offer }) {
  return (
    <section className="grid gap-4 md:grid-cols-[509fr_314fr]">
      <div className="relative aspect-[509/287] w-full overflow-hidden rounded-2xl bg-brand-bg-pill">
        <ImageCarousel images={offer.images} alt={offer.title} />
      </div>
      <div className="flex items-center gap-4 self-start rounded-2xl p-4">
        <div className="relative h-20 w-20 shrink-0 overflow-hidden rounded-3xl">
          <Image
            src={gameImage(offer.game.slug)}
            alt={offer.game.name}
            fill
            sizes="80px"
            className="object-cover"
          />
        </div>
        <div className="flex min-w-0 flex-1 flex-col text-left">
          <span className="font-display text-[16px] font-medium leading-5 text-brand-text-primary-light">
            {offer.game.name}
          </span>
          <span className="font-display text-[12px] font-medium leading-4 text-brand-text-secondary-dark">
            {offer.game.subtitle}
          </span>
        </div>
      </div>
    </section>
  );
}
