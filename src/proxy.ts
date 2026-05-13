import { createServerClient } from "@supabase/ssr";
import { NextResponse, type NextRequest } from "next/server";
import { globalPerIpPerMinute } from "@/lib/rate-limit";

/**
 * Best-effort client IP. Inlined here (rather than reusing `getClientIp`
 * from rate-limit.ts) because the proxy doesn't have access to
 * `next/headers` — that import path is for Server Components, not for
 * proxy / middleware. Vercel sets `x-forwarded-for`; leftmost entry is
 * the original client. Falls back to `x-real-ip`, then a sentinel that
 * buckets every unknown caller together (intentional — under attack
 * that bucket fills fast and trips the limit).
 */
function getIpFromRequest(request: NextRequest): string {
  const xff = request.headers.get("x-forwarded-for");
  if (xff) {
    const first = xff.split(",")[0]?.trim();
    if (first) return first;
  }
  return request.headers.get("x-real-ip") ?? "ip:unknown";
}

export async function proxy(request: NextRequest) {
  // Blanket per-IP cap — catches broad scraping / bot scanning across
  // every path. Skipped in dev because a single localhost IP burns the
  // bucket fast via HMR + multiple tabs. Fails open on Redis errors so a
  // limiter outage can't take the site down (the per-action limiters
  // below still apply on the hot paths that actually matter).
  if (process.env.NODE_ENV !== "development") {
    const ip = getIpFromRequest(request);
    try {
      const quota = await globalPerIpPerMinute.limit(ip);
      if (!quota.success) {
        return new NextResponse("Too many requests", {
          status: 429,
          headers: {
            "Retry-After": "60",
            "X-RateLimit-Limit": String(quota.limit),
            "X-RateLimit-Remaining": String(quota.remaining),
            "X-RateLimit-Reset": String(quota.reset),
          },
        });
      }
    } catch {
      // Fail open.
    }
  }

  // Safety net: if Supabase dropped the user at any path with a `code` param
  // (e.g. the Site URL instead of our redirectTo), forward to /api/auth/callback
  // so the code exchange actually runs.
  const stashedCode = request.nextUrl.searchParams.get("code");
  const isCallback = request.nextUrl.pathname.startsWith("/api/auth/callback");
  if (stashedCode && !isCallback) {
    const callback = new URL("/api/auth/callback", request.url);
    callback.searchParams.set("code", stashedCode);
    const next = request.nextUrl.searchParams.get("next");
    if (next) callback.searchParams.set("next", next);
    return NextResponse.redirect(callback);
  }

  let response = NextResponse.next({ request });

  const supabase = createServerClient(
    process.env.NEXT_PUBLIC_SUPABASE_URL!,
    process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY!,
    {
      cookies: {
        getAll() {
          return request.cookies.getAll();
        },
        setAll(cookiesToSet) {
          for (const { name, value } of cookiesToSet) {
            request.cookies.set(name, value);
          }
          response = NextResponse.next({ request });
          for (const { name, value, options } of cookiesToSet) {
            response.cookies.set(name, value, options);
          }
        },
      },
    },
  );

  // Refreshes the session token if it's close to expiry. Without this, the
  // server-side supabase.auth.getUser() on pages like /profile reads a stale
  // or missing cookie and bounces the user out.
  await supabase.auth.getUser();

  return response;
}

export const config = {
  matcher: [
    "/((?!_next/static|_next/image|favicon.ico|.*\\.(?:svg|png|jpg|jpeg|gif|webp|ico)$).*)",
  ],
};
