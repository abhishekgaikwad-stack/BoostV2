import Image from "next/image";
import Link from "next/link";
import type { Game } from "@/types";
import { gameImage } from "@/lib/images";
import { cn } from "@/lib/utils";

export function SquareProductCard({
  game,
  tone = "light",
  className,
  priority = false,
}: {
  game: Game;
  tone?: "light" | "dark";
  className?: string;
  /** Set on the LCP card so Next emits <link rel="preload"> for the cover. */
  priority?: boolean;
}) {
  return (
    <Link
      href={`/games/${game.slug}`}
      className={cn("group flex w-20 flex-col items-center gap-2", className)}
    >
      <div className="relative aspect-square w-20 overflow-hidden rounded-3xl">
        {game.cover ? (
          <Image
            src={gameImage(game.cover)}
            alt={game.name}
            fill
            sizes="80px"
            priority={priority}
            className="object-cover transition-transform duration-300 ease-out group-hover:scale-110"
          />
        ) : null}
      </div>
      <span
        className={cn(
          "font-display text-[12px] font-medium leading-4 text-center",
          tone === "light"
            ? "text-brand-text-primary-light"
            : "text-brand-text-primary-dark",
        )}
      >
        {game.name}
      </span>
    </Link>
  );
}
