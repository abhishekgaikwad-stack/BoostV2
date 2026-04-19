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

  let body: { avatarUrl?: string } = {};
  try {
    body = await request.json();
  } catch {
    return NextResponse.json({ error: "Invalid JSON" }, { status: 400 });
  }

  const { avatarUrl } = body;
  if (!avatarUrl || typeof avatarUrl !== "string") {
    return NextResponse.json({ error: "Missing avatarUrl" }, { status: 400 });
  }

  // Primary: mirror into Supabase user metadata under a namespaced key.
  // We deliberately don't write to `avatar_url` because OAuth providers
  // overwrite that field on every sign-in; `boost_avatar_url` is ours
  // and survives across sessions.
  await supabase.auth.updateUser({
    data: { boost_avatar_url: avatarUrl },
  });

  // Secondary: persist on our Prisma User row. Swallow errors so the UI
  // still updates if migrations haven't been run yet.
  let prismaSynced = true;
  try {
    await prisma.user.upsert({
      where: { id: user.id },
      update: { avatarUrl },
      create: {
        id: user.id,
        email: user.email ?? `${user.id}@no-email.local`,
        avatarUrl,
      },
    });
  } catch (error) {
    prismaSynced = false;
    console.warn("[profile/avatar] Prisma update failed:", error);
  }

  return NextResponse.json({ avatarUrl, prismaSynced });
}
