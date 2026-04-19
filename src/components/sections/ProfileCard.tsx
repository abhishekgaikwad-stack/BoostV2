import { ArrowRight, User } from "lucide-react";
import Image from "next/image";
import { LogoutButton } from "@/components/sections/LogoutButton";
import { cn } from "@/lib/utils";

export type ProfileCardProps = {
  displayName: string;
  registeredLabel: string;
  avatarUrl?: string | null;
  isSeller: boolean;
  walletBalance?: number;
  onHoldAmount?: number;
  currency?: string;
  potentialEarnings?: number;
  className?: string;
};

export function ProfileCard({
  displayName,
  registeredLabel,
  avatarUrl,
  isSeller,
  walletBalance = 0,
  onHoldAmount = 0,
  currency = "€",
  potentialEarnings = 20000,
  className,
}: ProfileCardProps) {
  return (
    <article
      className={cn(
        "flex w-full max-w-[407px] flex-col gap-6 rounded-[32px] bg-black p-8 text-white",
        className,
      )}
    >
      <header className="flex items-center gap-4">
        <div className="relative grid h-[72px] w-[72px] shrink-0 place-items-center overflow-hidden rounded-full bg-[#ff7536] text-white">
          {avatarUrl ? (
            <Image
              src={avatarUrl}
              alt={displayName}
              fill
              sizes="72px"
              className="object-cover"
            />
          ) : (
            <User className="h-8 w-8" strokeWidth={1.5} />
          )}
        </div>
        <div className="flex min-w-0 flex-1 flex-col">
          <span className="truncate font-display text-[20px] font-medium leading-[26px] text-white">
            {displayName}
          </span>
          <span className="font-display text-[16px] font-medium leading-5 text-brand-text-secondary-dark">
            {registeredLabel}
          </span>
        </div>
      </header>

      {isSeller ? (
        <SellerWallet
          balance={walletBalance}
          onHold={onHoldAmount}
          currency={currency}
        />
      ) : (
        <BuyerPromo earnings={potentialEarnings} currency={currency} />
      )}

      {isSeller ? (
        <p className="font-display text-[12px] font-normal leading-4 text-white">
          Funds will be available to withdraw after a warranty period, reach out
          for any support on issues or incomplete orders.
        </p>
      ) : null}

      <div>
        <LogoutButton />
      </div>
    </article>
  );
}

function formatMoney(amount: number, currency: string) {
  const formatted = amount.toLocaleString(undefined, {
    minimumFractionDigits: amount % 1 === 0 ? 0 : 2,
    maximumFractionDigits: 2,
  });
  return `${currency}${formatted}`;
}

function SellerWallet({
  balance,
  onHold,
  currency,
}: {
  balance: number;
  onHold: number;
  currency: string;
}) {
  return (
    <section className="flex flex-col gap-5 rounded-3xl bg-[#55ff37] p-5 text-black">
      <div className="flex flex-col gap-2">
        <span className="font-display text-[16px] font-medium leading-5">
          Wallet Balance
        </span>
        <span className="font-display text-[32px] font-medium leading-9">
          {formatMoney(balance, currency)}
        </span>
      </div>
      <div className="inline-flex h-10 w-fit items-center rounded-lg bg-black px-3 font-display text-[14px] font-medium leading-6 text-white">
        {formatMoney(onHold, currency)} On hold
      </div>
    </section>
  );
}

function BuyerPromo({
  earnings,
  currency,
}: {
  earnings: number;
  currency: string;
}) {
  return (
    <section className="flex flex-col gap-5 rounded-3xl bg-[#55ff37] p-5 text-black">
      <div className="flex flex-col gap-2">
        <span className="font-display text-[16px] font-medium leading-5">
          Become a seller and earn upto
        </span>
        <div className="flex items-baseline gap-2">
          <span className="font-display text-[32px] font-medium leading-9">
            {formatMoney(earnings, currency)}
          </span>
          <span className="font-display text-[16px] font-medium leading-5">
            /month
          </span>
        </div>
      </div>
      <button
        type="button"
        className="inline-flex h-10 w-fit items-center gap-2 rounded-lg bg-black px-3 font-display text-[14px] font-medium leading-6 text-white transition hover:bg-brand-bg-elevated"
      >
        Start selling
        <ArrowRight className="h-4 w-4" strokeWidth={1.5} />
      </button>
    </section>
  );
}
