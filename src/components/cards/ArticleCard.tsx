import { Clock } from "lucide-react";
import type { Article } from "@/types";
import { cn } from "@/lib/utils";

export function ArticleCard({
  article,
  className,
}: {
  article: Article;
  className?: string;
}) {
  return (
    <article
      className={cn(
        "flex flex-col gap-3 rounded-2xl border border-brand-border-subtle bg-brand-bg-surface p-4",
        className,
      )}
    >
      <div className="aspect-[368/164] w-full rounded-xl bg-[#d9d9d9]" />
      <h3 className="font-display text-[16px] font-medium leading-5 text-brand-text-primary-dark">
        {article.title}
      </h3>
      <div className="flex items-center justify-between">
        <span className="rounded-lg bg-brand-bg-elevated px-3 py-1.5 font-display text-[10px] font-medium leading-3 tracking-[0.05em] text-brand-text-primary-dark ring-1 ring-brand-border-subtle">
          {article.tag}
        </span>
        <div className="flex items-center gap-1.5 text-brand-text-primary-dark">
          <Clock className="h-4 w-4" strokeWidth={1.5} />
          <span className="font-display text-[12px] font-medium leading-4">
            {article.duration}
          </span>
        </div>
      </div>
      <span className="font-display text-[12px] font-medium leading-4 text-brand-text-primary-dark">
        {article.date}
      </span>
    </article>
  );
}
