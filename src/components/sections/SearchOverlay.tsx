import { Search } from "lucide-react";
import Image from "next/image";
import Link from "next/link";
import { popularGames } from "@/lib/mock";
import { gameImage } from "@/lib/images";

const letters = "ABCDEFGHIJKLMNOPQRSTUVXYZ".split("");

export function SearchOverlay() {
  const games = popularGames.slice(0, 12);

  return (
    <div className="flex flex-col gap-6 rounded-[32px] bg-black p-8 text-brand-text-primary-dark shadow-2xl">
      <label className="flex h-16 items-center gap-3 rounded-2xl bg-brand-text-primary-light px-6">
        <Search
          className="h-5 w-5 text-brand-text-secondary-dark"
          strokeWidth={1.5}
        />
        <input
          type="text"
          autoFocus
          placeholder="Search by Game"
          className="flex-1 bg-transparent font-display text-[16px] font-medium text-white placeholder:text-brand-text-secondary-dark focus:outline-none"
        />
      </label>

      <div className="flex items-center justify-between">
        {letters.map((letter) => (
          <button
            key={letter}
            type="button"
            className="font-display text-[14px] font-medium leading-4 text-brand-text-secondary-dark transition hover:text-brand-text-primary-dark"
          >
            {letter}
          </button>
        ))}
      </div>

      <div className="grid grid-cols-4 gap-x-6 gap-y-4">
        {games.map((game) => {
          return (
            <Link
              key={game.id}
              href={`/games/${game.slug}`}
              className="flex items-center gap-3 rounded-[calc(var(--spacing)*6)] p-1 text-left transition hover:bg-brand-bg-surface"
            >
              <span className="relative h-20 w-20 shrink-0 overflow-hidden rounded-3xl bg-brand-border">
                {game.cover ? (
                  <Image
                    src={gameImage(game.cover)}
                    alt={game.name}
                    fill
                    sizes="80px"
                    className="object-cover"
                  />
                ) : null}
              </span>
              <span className="flex flex-col gap-1">
                <span className="font-display text-[14px] font-medium leading-4 text-brand-text-primary-dark">
                  {game.name}
                </span>
                <span className="font-display text-[12px] font-medium leading-4 text-brand-text-secondary-dark">
                  Accounts
                </span>
              </span>
            </Link>
          );
        })}
      </div>
    </div>
  );
}
