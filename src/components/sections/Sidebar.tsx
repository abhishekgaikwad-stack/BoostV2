import { Heart, ShoppingBag, Tag } from "lucide-react";
import Image from "next/image";
import Link from "next/link";
import { assetUrl } from "@/lib/images";
import { cn } from "@/lib/utils";

const sidebarNav = [
  { id: "orders", label: "Orders", icon: ShoppingBag, href: "/user/orders" },
  { id: "sell", label: "Sell", icon: Tag, href: "/sell" },
  { id: "wishlist", label: "Wishlist", icon: Heart, href: "/wishlist" },
];

// Sticky (not fixed) so the rail stays pinned while the row is in view and
// then scrolls up with the page once the footer is reached. `self-start` +
// `h-screen` keeps it pinned to the top of the row regardless of row height.
export function Sidebar() {
  return (
    <aside className="sticky top-0 z-30 hidden h-screen w-[120px] shrink-0 flex-col items-center gap-6 self-start bg-black pb-6 pt-[calc(var(--spacing)*12)] lg:flex">
      <Link
        href="/"
        className="flex flex-col items-center gap-[calc(var(--spacing)*2)]"
        aria-label="Boost home"
      >
        <span className="relative block h-[72px] w-[72px]">
          <Image
            src={assetUrl("boost-logo-icon.svg")}
            alt="Boost"
            fill
            sizes="72px"
            priority
            className="object-contain"
          />
        </span>
        <span className="font-display text-[16px] font-medium leading-5 text-white">
          boost
        </span>
      </Link>
      <nav className="mt-10 flex flex-col items-center gap-7">
        {sidebarNav.map((item) => (
          <Link
            key={item.id}
            href={item.href}
            className="flex flex-col items-center gap-2"
          >
            <span
              className={cn(
                "grid h-14 w-14 place-items-center rounded-xl bg-brand-bg-elevated text-brand-text-primary-dark transition hover:bg-brand-border",
              )}
            >
              <item.icon className="h-6 w-6" strokeWidth={1.5} />
            </span>
            <span className="font-display text-[12px] font-normal leading-5 text-brand-text-secondary-dark">
              {item.label}
            </span>
          </Link>
        ))}
      </nav>
    </aside>
  );
}
