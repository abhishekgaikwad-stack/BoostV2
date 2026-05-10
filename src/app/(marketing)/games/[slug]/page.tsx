import { ArrowLeft } from "lucide-react";
import Link from "next/link";
import { notFound } from "next/navigation";
import { FaqSection } from "@/components/sections/FaqSection";
import { GameListingsBoard } from "@/components/sections/GameListingsBoard";
import { faqsForGame } from "@/lib/mock";
import { findGameBySlug, offersForGame } from "@/lib/offers";

export default async function GameListingPage({
  params,
}: {
  params: Promise<{ slug: string }>;
}) {
  const { slug } = await params;

  const game = await findGameBySlug(slug);
  if (!game) notFound();

  // Wider fetch than the default 24 so client-side search/filter/sort works
  // over a meaningful set without a load-more flow. Revisit when per-game
  // catalogs cross ~500 listings — at that point this needs to move
  // server-side via URL params + cursor pagination.
  const { items: offers } = await offersForGame(slug, { limit: 100 });

  return (
    <div className="flex flex-col gap-8">
      <Link
        href="/"
        className="inline-flex w-fit items-center gap-2 rounded-xl border border-brand-border-light bg-white px-4 py-2 font-display text-[14px] font-medium text-brand-text-primary-light transition hover:bg-brand-bg-light"
      >
        <ArrowLeft className="h-4 w-4" strokeWidth={1.5} />
        Home
      </Link>

      <h1 className="font-display text-[28px] font-medium leading-8 text-brand-text-primary-light">
        {game.name} accounts
      </h1>

      <GameListingsBoard offers={offers} gameName={game.name} />

      <FaqSection faqs={faqsForGame(slug)} />
    </div>
  );
}
