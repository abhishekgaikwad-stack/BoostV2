import { ProductCard } from "@/components/cards/ProductCard";
import type { Account } from "@/types";

export function SimilarAccounts({ accounts }: { accounts: Account[] }) {
  if (accounts.length === 0) return null;

  return (
    <section className="flex flex-col gap-6">
      <h2 className="font-display text-[24px] font-medium leading-7 text-brand-text-primary-light">
        Similar Accounts
      </h2>
      <div className="grid grid-cols-1 gap-4 sm:grid-cols-2 md:grid-cols-3 lg:grid-cols-5">
        {accounts.map((account) => (
          <ProductCard key={account.id} account={account} />
        ))}
      </div>
    </section>
  );
}
