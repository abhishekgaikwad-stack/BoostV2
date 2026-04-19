import { NextResponse } from "next/server";
import { createSupabaseServerClient } from "@/lib/supabase/server";

// Diagnostic endpoint. Hit /api/whoami in the browser to see what the
// server thinks of your current session. Remove before launch.
export async function GET() {
  const supabase = await createSupabaseServerClient();
  const {
    data: { user },
    error,
  } = await supabase.auth.getUser();

  return NextResponse.json({
    authenticated: Boolean(user),
    userId: user?.id ?? null,
    email: user?.email ?? null,
    provider: user?.app_metadata?.provider ?? null,
    error: error?.message ?? null,
  });
}
