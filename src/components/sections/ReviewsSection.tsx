import { CarouselNav } from "@/components/cards/CarouselNav";
import { ReviewCard } from "@/components/cards/ReviewCard";
import { reviews } from "@/lib/mock";

export function ReviewsSection() {
  return (
    <section className="flex flex-col gap-6 rounded-3xl bg-black p-8">
      <header className="flex items-center justify-between">
        <h2 className="font-display text-[18px] font-bold leading-6 text-brand-text-primary-dark">
          Reviews
        </h2>
        <CarouselNav />
      </header>
      <div className="grid grid-cols-1 gap-4 sm:grid-cols-2 lg:grid-cols-4">
        {reviews.map((review) => (
          <ReviewCard key={review.id} review={review} />
        ))}
      </div>
    </section>
  );
}
