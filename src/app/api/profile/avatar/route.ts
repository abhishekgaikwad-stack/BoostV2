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

  // Write to public.profiles (canonical) and mirror into user_metadata so
  // the UI can pick it up without an extra DB read.
  const { error } = await supabase
    .from("profiles")
    .upsert(
      {
        id: user.id,
        email: user.email ?? `${user.id}@no-email.local`,
        avatar_url: avatarUrl,
      },
      { onConflict: "id" },
    );

  if (error) {
    console.error("[profile/avatar] profiles upsert failed:", error);
    return NextResponse.json(
      { error: "Could not save avatar URL" },
      { status: 500 },
    );
  }

  // Using a namespaced key so OAuth re-sign-ins don't clobber the uploaded
  // avatar (providers overwrite user_metadata.avatar_url).
  await supabase.auth.updateUser({
    data: { boost_avatar_url: avatarUrl },
  });

  return NextResponse.json({ avatarUrl });
}
