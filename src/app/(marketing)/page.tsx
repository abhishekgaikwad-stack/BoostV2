import { FlashSaleSection } from "@/components/sections/FlashSaleSection";
import { HeroSection } from "@/components/sections/HeroSection";
import { NewAccountsSection } from "@/components/sections/NewAccountsSection";
import { PopularGamesCarousel } from "@/components/sections/PopularGamesCarousel";
import { ReviewsSection } from "@/components/sections/ReviewsSection";
import { StatsSection } from "@/components/sections/StatsSection";
import { TopArticlesSection } from "@/components/sections/TopArticlesSection";
import { TrendingCategoriesSection } from "@/components/sections/TrendingCategoriesSection";

export default function HomePage() {
  return (
    <>
      <HeroSection />
      <PopularGamesCarousel />
      <StatsSection />
      <NewAccountsSection />
      <ReviewsSection />
      <TopArticlesSection />
      <FlashSaleSection />
      <TrendingCategoriesSection />
    </>
  );
}
