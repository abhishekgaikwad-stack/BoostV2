import { createServerClient } from "@supabase/ssr";
import { NextResponse, type NextRequest } from "next/server";

export async function proxy(request: NextRequest) {
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
