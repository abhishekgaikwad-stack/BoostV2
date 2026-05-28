import { AuthPromptProvider } from "@/components/auth/AuthPromptProvider";
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
      <div className="flex min-h-screen flex-col bg-white lg:pl-[120px]">
        <SiteHeader />
        <main className="flex flex-1 flex-col gap-[calc(var(--spacing)*18)] px-[calc(var(--spacing)*28)] pb-[calc(var(--spacing)*36)] pt-[calc(var(--spacing)*12)]">
          <WishlistProvider>{children}</WishlistProvider>
        </main>
        <SiteFooter />
      </div>
    </AuthPromptProvider>
  );
}
