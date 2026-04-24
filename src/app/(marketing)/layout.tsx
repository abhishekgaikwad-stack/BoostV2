import { AuthPromptProvider } from "@/components/auth/AuthPromptProvider";
import { SiteFooter } from "@/components/sections/SiteFooter";
import { SiteHeader } from "@/components/sections/SiteHeader";
import { WishlistProvider } from "@/components/wishlist/WishlistProvider";
import { createSupabaseServerClient } from "@/lib/supabase/server";
import { getMyWishlistIds } from "@/lib/wishlist";

export default async function MarketingLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  const supabase = await createSupabaseServerClient();
  const {
    data: { user },
  } = await supabase.auth.getUser();
  const initialIds = user ? await getMyWishlistIds() : [];

  return (
    <AuthPromptProvider>
      <div className="min-h-screen bg-white lg:pl-[120px]">
        <SiteHeader />
        <main className="flex flex-col gap-[calc(var(--spacing)*18)] px-[calc(var(--spacing)*28)] pb-[calc(var(--spacing)*36)] pt-[calc(var(--spacing)*12)]">
          <WishlistProvider initialIds={initialIds} enabled={!!user}>
            {children}
          </WishlistProvider>
        </main>
        <SiteFooter />
      </div>
    </AuthPromptProvider>
  );
}
