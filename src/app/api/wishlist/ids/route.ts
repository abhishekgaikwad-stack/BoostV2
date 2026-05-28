import { NextResponse } from "next/server";
import { getMyWishlistIds } from "@/lib/wishlist";
import { createSupabaseServerClient } from "@/lib/supabase/server";

// Per-user — never cache at the CDN. The marketing pages are cached
// publicly with anonymous HTML; the client hydrates wishlist state by
// calling this endpoint after mount.
export const dynamic = "force-dynamic";

export async function GET() {
  const supabase = await createSupabaseServerClient();
  const {
    data: { user },
  } = await supabase.auth.getUser();

  if (!user) {
    return NextResponse.json(
      { authenticated: false, ids: [] as string[] },
      { headers: { "Cache-Control": "private, no-store" } },
    );
  }

  const ids = await getMyWishlistIds();
  return NextResponse.json(
    { authenticated: true, ids },
    { headers: { "Cache-Control": "private, no-store" } },
  );
}
