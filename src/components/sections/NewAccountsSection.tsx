import { ProductCard } from "@/components/cards/ProductCard";
import { newAccounts } from "@/lib/mock";

export function NewAccountsSection() {
  return (
    <section className="flex flex-col gap-6">
      <h2 className="font-display text-[24px] font-bold leading-7 text-brand-text-primary-light">
        New Accounts
      </h2>
      <div className="grid grid-cols-1 gap-4 sm:grid-cols-2 md:grid-cols-3 lg:grid-cols-4 xl:grid-cols-5">
        {newAccounts.map((account) => (
          <ProductCard key={account.id} account={account} />
        ))}
      </div>
    </section>
  );
}
