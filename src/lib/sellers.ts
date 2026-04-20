import {
  findSellerByStoreId as findMockSeller,
  type SellerProfile,
} from "@/lib/mock";
import { createSupabaseAdminClient } from "@/lib/supabase/admin";

function deriveName(
  metadata: Record<string, unknown>,
  email: string | undefined,
  fallback: string,
) {
  const fullName =
    typeof metadata.full_name === "string" ? metadata.full_name : undefined;
  const name = typeof metadata.name === "string" ? metadata.name : undefined;
  const username =
    typeof metadata.user_name === "string" ? metadata.user_name : undefined;
  return fullName ?? name ?? username ?? email?.split("@")[0] ?? fallback;
}

function deriveAvatar(metadata: Record<string, unknown>): string | undefined {
  const custom =
    typeof metadata.boost_avatar_url === "string"
      ? metadata.boost_avatar_url
      : undefined;
  const oauth =
    typeof metadata.avatar_url === "string" ? metadata.avatar_url : undefined;
  return custom ?? oauth;
}

// Looks the real user up by storeId in Supabase auth. Falls back to the mock
// catalog when the admin client isn't configured, no user has that storeId,
// or anything else goes wrong. Rating / reviews / listings still come from
// mock data until the Prisma tables are live.
export async function resolveSellerProfile(
  storeId: number,
): Promise<SellerProfile | null> {
  const mock = findMockSeller(storeId);

  try {
    const admin = createSupabaseAdminClient();
    // admin.listUsers() is paginated (default 50 per page). Sweep pages until
    // we find one with the matching storeId or run out.
    let page = 1;
    while (true) {
      const { data, error } = await admin.auth.admin.listUsers({
        page,
        perPage: 200,
      });
      if (error) throw error;
      const match = data.users.find(
        (u) => (u.user_metadata as { storeId?: number } | null)?.storeId === storeId,
      );
      if (match) {
        const metadata = (match.user_metadata ?? {}) as Record<string, unknown>;
        return {
          id: match.id,
          name: deriveName(metadata, match.email, `User-${storeId}`),
          avatarUrl: deriveAvatar(metadata),
          isOnline: mock?.isOnline ?? false,
          rating: mock?.rating ?? 0,
          reviewCount: mock?.reviewCount ?? 0,
          storeId,
          registeredAt: match.created_at ?? new Date().toISOString(),
          productCount: mock?.productCount ?? 0,
          reviews: mock?.reviews ?? [],
        };
      }
      if (data.users.length < 200) break;
      page += 1;
    }
  } catch (error) {
    console.warn("[sellers] Supabase admin lookup failed:", error);
  }

  return mock;
}
