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

  // Primary: Supabase user_metadata so the ProfileCard picks it up immediately.
  await supabase.auth.updateUser({ data: { isSeller: body.isSeller } });

  // Secondary: mirror into Prisma User.isSeller (best-effort — swallows when
  // DATABASE_URL isn't configured yet).
  let prismaSynced = true;
  try {
    await prisma.user.upsert({
      where: { id: user.id },
      update: { isSeller: body.isSeller },
      create: {
        id: user.id,
        email: user.email ?? `${user.id}@no-email.local`,
        isSeller: body.isSeller,
      },
    });
  } catch (error) {
    prismaSynced = false;
    console.warn("[profile/account-type] Prisma update failed:", error);
  }

  return NextResponse.json({ isSeller: body.isSeller, prismaSynced });
}
