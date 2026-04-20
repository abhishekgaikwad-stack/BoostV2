import {
  findSellerByStoreId as findMockSeller,
  type SellerProfile,
} from "@/lib/mock";
import { createSupabaseServerClient } from "@/lib/supabase/server";

// Queries public.profiles by store_id. Anyone can read (RLS policy lets it)
// so we don't need the service-role key. Mock values fill in rating / reviews
// / product count until those tables exist.
export async function resolveSellerProfile(
  storeId: number,
): Promise<SellerProfile | null> {
  const mock = findMockSeller(storeId);

  try {
    const supabase = await createSupabaseServerClient();
    const { data, error } = await supabase
      .from("profiles")
      .select("id, email, name, avatar_url, is_seller, store_id, created_at")
      .eq("store_id", storeId)
      .maybeSingle();

    if (error) throw error;
    if (!data) return mock;

    const fallbackName =
      data.email?.split("@")[0] ?? `User-${data.store_id ?? storeId}`;

    return {
      id: data.id,
      name: data.name ?? fallbackName,
      avatarUrl: data.avatar_url ?? undefined,
      isOnline: mock?.isOnline ?? false,
      rating: mock?.rating ?? 0,
      reviewCount: mock?.reviewCount ?? 0,
      storeId: data.store_id ?? storeId,
      registeredAt: data.created_at ?? new Date().toISOString(),
      productCount: mock?.productCount ?? 0,
      reviews: mock?.reviews ?? [],
    };
  } catch (error) {
    console.warn("[sellers] profiles lookup failed:", error);
    return mock;
  }
}
