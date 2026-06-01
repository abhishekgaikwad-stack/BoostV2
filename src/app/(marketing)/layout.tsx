import { AuthPromptProvider } from "@/components/auth/AuthPromptProvider";
import { Sidebar } from "@/components/sections/Sidebar";
import { SiteFooter } from "@/components/sections/SiteFooter";
import { SiteHeader } from "@/components/sections/SiteHeader";
import { WishlistProvider } from "@/components/wishlist/WishlistProvider";

export default function MarketingLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  return (
    <AuthPromptProvider>
      <div className="flex min-h-screen flex-col bg-white">
        {/* Row: sidebar (sticky) | content. Sidebar stays pinned while this
            row is in view and scrolls up with the page once we reach the
            footer (which is a sibling, outside this row). */}
        <div className="flex flex-1">
          <Sidebar />
          <div className="flex min-w-0 flex-1 flex-col">
            <SiteHeader />
            <main className="flex flex-1 flex-col gap-[calc(var(--spacing)*18)] px-[calc(var(--spacing)*28)] pb-[calc(var(--spacing)*36)] pt-[calc(var(--spacing)*12)]">
              <WishlistProvider>{children}</WishlistProvider>
            </main>
          </div>
        </div>
        <SiteFooter />
      </div>
    </AuthPromptProvider>
  );
}
