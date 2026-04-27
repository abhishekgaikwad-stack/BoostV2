import { NextResponse } from "next/server";
import { detectListingAttrs } from "@/lib/ai-detect";
import { createSupabaseServerClient } from "@/lib/supabase/server";

export const runtime = "nodejs";

export async function POST(req: Request) {
  const supabase = await createSupabaseServerClient();
  const {
    data: { user },
  } = await supabase.auth.getUser();
  if (!user) {
    return NextResponse.json({ error: "Sign in required" }, { status: 401 });
  }

  let body: { title?: unknown; description?: unknown };
  try {
    body = (await req.json()) as { title?: unknown; description?: unknown };
  } catch {
    return NextResponse.json({ error: "Invalid JSON body" }, { status: 400 });
  }

  const result = await detectListingAttrs({
    title: typeof body.title === "string" ? body.title : "",
    description: typeof body.description === "string" ? body.description : "",
  });

  if (!result.ok) {
    return NextResponse.json(
      {
        error: result.error,
        upstreamStatus: result.upstreamStatus,
        upstreamBody: result.upstreamBody,
        platform: null,
        region: null,
      },
      { status: result.upstreamStatus ? 502 : 500 },
    );
  }

  return NextResponse.json(result.attrs);
}
