import { NextResponse } from "next/server";
import { detectListingAttrs } from "@/lib/ai-detect";
import {
  aiDetectPerIpDaily,
  aiDetectPerUserDaily,
  getClientIp,
} from "@/lib/rate-limit";
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

  // Stacked caps: per-user 100/d catches normal abuse, per-IP 200/d catches
  // multi-account amplification. Run in parallel so legitimate requests pay
  // one round-trip, not two. Both buckets tick on every call regardless of
  // outcome — that's intentional, each is an independent counter.
  const ip = await getClientIp();
  const [userQuota, ipQuota] = await Promise.all([
    aiDetectPerUserDaily.limit(user.id),
    aiDetectPerIpDaily.limit(ip),
  ]);
  // Surface the user cap first when both fail so the message is actionable
  // for the caller (signing out won't help with the IP cap).
  if (!userQuota.success) {
    return NextResponse.json(
      {
        error: "Daily AI limit reached. Try again later.",
        retryAt: userQuota.reset,
        remaining: 0,
      },
      {
        status: 429,
        headers: {
          "X-RateLimit-Limit": String(userQuota.limit),
          "X-RateLimit-Remaining": String(userQuota.remaining),
          "X-RateLimit-Reset": String(userQuota.reset),
        },
      },
    );
  }
  if (!ipQuota.success) {
    return NextResponse.json(
      {
        error: "Too many AI requests from your network today. Try again later.",
        retryAt: ipQuota.reset,
        remaining: 0,
      },
      {
        status: 429,
        headers: {
          "X-RateLimit-Limit": String(ipQuota.limit),
          "X-RateLimit-Remaining": String(ipQuota.remaining),
          "X-RateLimit-Reset": String(ipQuota.reset),
        },
      },
    );
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
