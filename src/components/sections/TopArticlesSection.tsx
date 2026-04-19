import { ArticleCard } from "@/components/cards/ArticleCard";
import { CarouselNav } from "@/components/cards/CarouselNav";
import { articles } from "@/lib/mock";

export function TopArticlesSection() {
  return (
    <section className="flex flex-col gap-6 rounded-3xl bg-black p-8">
      <header className="flex items-center justify-between">
        <h2 className="font-display text-[16px] font-medium leading-5 text-brand-text-primary-dark">
          Top articles this week
        </h2>
        <CarouselNav />
      </header>
      <div className="grid grid-cols-1 gap-4 md:grid-cols-2 lg:grid-cols-3">
        {articles.map((article) => (
          <ArticleCard key={article.id} article={article} />
        ))}
      </div>
    </section>
  );
}
