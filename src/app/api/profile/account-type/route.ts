import { NextResponse } from "next/server";
import { createSupabaseServerClient } from "@/lib/supabase/server";

export async function PATCH(request: Request) {
  const supabase = await createSupabaseServerClient();
  const {
    data: { user },
  } = await supabase.auth.getUser();
  if (!user) {
    return NextResponse.json({ error: "Unauthenticated" }, { status: 401 });
  }

  let body: { isSeller?: boolean } = {};
  try {
    body = await request.json();
  } catch {
    return NextResponse.json({ error: "Invalid JSON" }, { status: 400 });
  }

  if (typeof body.isSeller !== "boolean") {
    return NextResponse.json(
      { error: "isSeller must be a boolean" },
      { status: 400 },
    );
  }

  // Ensure a profile row exists, then flip is_seller. The `ensure_store_id`
  // DB trigger auto-assigns store_id from public.store_id_seq (starting at
  // 100) the first time is_seller becomes true.
  const { data: profile, error } = await supabase
    .from("profiles")
    .upsert(
      {
        id: user.id,
        email: user.email ?? `${user.id}@no-email.local`,
        is_seller: body.isSeller,
      },
      { onConflict: "id" },
    )
    .select("store_id, is_seller")
    .single();

  if (error) {
    console.error("[profile/account-type] profiles upsert failed:", error);
    return NextResponse.json(
      { error: error.message ?? "Could not update account type" },
      { status: 500 },
    );
  }

  // Mirror into Supabase user_metadata so client components see the change
  // immediately without a DB round-trip.
  await supabase.auth.updateUser({
    data: {
      isSeller: profile.is_seller,
      ...(profile.store_id ? { storeId: profile.store_id } : {}),
    },
  });

  return NextResponse.json({
    isSeller: profile.is_seller,
    storeId: profile.store_id ?? null,
  });
}
