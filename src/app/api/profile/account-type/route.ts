import { NextResponse } from "next/server";
import { prisma } from "@/lib/prisma";
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

  // Try Prisma first so we can capture the auto-assigned storeId (starts at 100
  // per prisma/seed.ts) and mirror it into Supabase metadata. Without a DB,
  // we just fall through and update metadata with isSeller only.
  let prismaSynced = true;
  let storeId: number | undefined;
  try {
    const row = await prisma.user.upsert({
      where: { id: user.id },
      update: { isSeller: body.isSeller },
      create: {
        id: user.id,
        email: user.email ?? `${user.id}@no-email.local`,
        isSeller: body.isSeller,
      },
    });
    storeId = row.storeId;
  } catch (error) {
    prismaSynced = false;
    console.warn("[profile/account-type] Prisma update failed:", error);
  }

  await supabase.auth.updateUser({
    data: {
      isSeller: body.isSeller,
      ...(storeId !== undefined ? { storeId } : {}),
    },
  });

  return NextResponse.json({
    isSeller: body.isSeller,
    storeId: storeId ?? null,
    prismaSynced,
  });
}
