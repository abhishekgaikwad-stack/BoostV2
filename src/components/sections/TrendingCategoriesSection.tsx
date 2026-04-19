import { categories } from "@/lib/mock";

export function TrendingCategoriesSection() {
  return (
    <section className="rounded-3xl bg-brand-bg-pill p-8">
      <h2 className="mb-6 font-display text-[18px] font-bold leading-6 text-brand-text-primary-light">
        Trending game categories
      </h2>
      <div className="flex flex-wrap gap-3">
        {categories.map((category) => (
          <button
            key={category.id}
            type="button"
            className="rounded-xl bg-brand-bg-surface-light px-4 py-2.5 font-display text-[13px] font-medium text-brand-text-primary-light shadow-sm transition hover:bg-brand-border-light"
          >
            {category.name}
          </button>
        ))}
      </div>
    </section>
  );
}
