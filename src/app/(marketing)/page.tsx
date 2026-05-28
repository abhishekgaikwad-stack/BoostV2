import { FlashSaleSection } from "@/components/sections/FlashSaleSection";
import { HeroSection } from "@/components/sections/HeroSection";
import { NewAccountsSection } from "@/components/sections/NewAccountsSection";
import { PopularGamesCarousel } from "@/components/sections/PopularGamesCarousel";
import { StatsSection } from "@/components/sections/StatsSection";
import { TopArticlesSection } from "@/components/sections/TopArticlesSection";
import { TrendingCategoriesSection } from "@/components/sections/TrendingCategoriesSection";

// Per-visitor state (wishlist, auth) is hydrated client-side via
// /api/wishlist/ids so the rendered HTML is identical for every visitor
// and CloudFront can cache it at the edge.
//
// `force-static` is required (not just `revalidate`) because the public
// data loaders call `createSupabaseServerClient()`, which reads cookies()
// — that alone would mark the route dynamic. force-static makes
// cookies()/headers() return empty values during render, which is fine
// here: every query (`listGames`, `recentOffers`, `firstFlashOffer`)
// reads public, RLS-anon-allowed tables.
//
// Combined: Next emits `Cache-Control: s-maxage=60, stale-while-revalidate`
// and the in-memory render is refreshed at most once per minute.
export const dynamic = "force-static";
export const revalidate = 60;

export default function HomePage() {
  return (
    <>
      <HeroSection />
      <PopularGamesCarousel />
      <StatsSection />
      <NewAccountsSection />
      <TopArticlesSection />
      <FlashSaleSection />
      <TrendingCategoriesSection />
    </>
  );
}
