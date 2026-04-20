import Image from "next/image";
import Link from "next/link";
import type { Game } from "@/types";
import { gameImage } from "@/lib/images";
import { cn } from "@/lib/utils";

export function SquareProductCard({
  game,
  tone = "light",
  className,
}: {
  game: Game;
  tone?: "light" | "dark";
  className?: string;
}) {
  const slug = game.slug ?? game.cover ?? game.id;
  return (
    <Link
      href={`/games/${slug}`}
      className={cn("flex w-20 flex-col items-center gap-2", className)}
    >
      <div
        className={cn(
          "relative aspect-square w-20 overflow-hidden rounded-3xl",
          tone === "light" ? "bg-brand-bg-pill" : "bg-brand-bg-surface-light",
        )}
      >
        {game.cover ? (
          <Image
            src={gameImage(game.cover)}
            alt={game.name}
            fill
            sizes="80px"
            className="object-cover"
          />
        ) : null}
      </div>
      <span
        className={cn(
          "font-display text-[12px] font-medium leading-4",
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
