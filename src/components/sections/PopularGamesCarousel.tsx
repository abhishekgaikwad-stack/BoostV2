import { ArrowRight } from "lucide-react";
import { SquareProductCard } from "@/components/cards/SquareProductCard";
import { listGames } from "@/lib/offers";

export async function PopularGamesCarousel() {
  const games = await listGames(20);
  if (games.length === 0) return null;
  const popularGames = games.slice(0, 14);
  const newGames = games.slice(-6);
  return (
    <section className="grid gap-6 lg:grid-cols-[1fr_auto]">
      <div className="flex flex-col gap-6">
        <h2 className="font-display text-[24px] font-medium leading-7 text-brand-text-primary-light">
          Popular Games
        </h2>
        <div className="grid grid-cols-4 gap-x-4 gap-y-6 sm:grid-cols-5 md:grid-cols-6 lg:grid-cols-7">
          {popularGames.map((game) => (
            <SquareProductCard key={game.id} game={game} />
          ))}
        </div>
        <button
          type="button"
          className="inline-flex w-fit items-center gap-2 rounded-xl bg-brand-bg-pill px-5 py-3 font-display text-[13px] font-medium text-brand-text-primary-light transition hover:bg-brand-border-light"
        >
          More Games
          <ArrowRight className="h-4 w-4" strokeWidth={1.5} />
        </button>
      </div>

      <aside className="rounded-[32px] bg-brand-bg-surface px-[calc(var(--spacing)*12)] py-6">
        <h3 className="mb-6 font-display text-[16px] font-medium leading-5 text-brand-text-primary-dark">
          New Games
        </h3>
        <div className="grid grid-cols-3 gap-x-[calc(var(--spacing)*12)] gap-y-6">
          {newGames.map((game) => (
            <SquareProductCard key={game.id} game={game} tone="dark" />
          ))}
        </div>
      </aside>
    </section>
  );
}
