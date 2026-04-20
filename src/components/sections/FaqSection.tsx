import { ChevronDown } from "lucide-react";
import type { Faq } from "@/lib/mock";

export function FaqSection({ faqs }: { faqs: Faq[] }) {
  if (faqs.length === 0) return null;

  return (
    <section className="flex flex-col gap-6 rounded-3xl bg-black p-8 text-white">
      <h2 className="font-display text-[24px] font-medium leading-7 text-brand-text-primary-dark">
        Frequently asked questions
      </h2>
      <div className="flex flex-col gap-3">
        {faqs.map((faq) => (
          <details
            key={faq.question}
            className="group rounded-2xl bg-brand-bg-elevated px-5 py-4 [&>summary::-webkit-details-marker]:hidden"
          >
            <summary className="flex cursor-pointer list-none items-center justify-between gap-4">
              <span className="font-display text-[16px] font-medium leading-5 text-brand-text-primary-dark">
                {faq.question}
              </span>
              <ChevronDown
                className="h-5 w-5 shrink-0 text-brand-text-secondary-dark transition-transform group-open:rotate-180"
                strokeWidth={1.5}
              />
            </summary>
            <p className="mt-3 font-display text-[13px] font-medium leading-5 text-brand-text-secondary-dark">
              {faq.answer}
            </p>
          </details>
        ))}
      </div>
    </section>
  );
}
