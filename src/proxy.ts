import { createServerClient } from "@supabase/ssr";
import { NextResponse, type NextRequest } from "next/server";
import type { Database } from "@/types/database.types";

/**
 * Session handling for Supabase + Next.js (spec 05, REQ-06).
 *
 * Next.js 16 renamed the middleware convention to `proxy` (middleware.ts is
 * deprecated). Supabase's current guidance: refresh the token here before
 * any route renders, propagate refreshed cookies to the response, and
 * redirect unauthenticated users away from protected routes.
 */

const PROTECTED_PREFIXES = ["/dashboard"];
const AUTH_PAGES = ["/login", "/register"];

export async function proxy(request: NextRequest) {
  let supabaseResponse = NextResponse.next({ request });

  const supabase = createServerClient<Database>(
    process.env.NEXT_PUBLIC_SUPABASE_URL!,
    process.env.NEXT_PUBLIC_SUPABASE_PUBLISHABLE_KEY!,
    {
      cookies: {
        getAll() {
          return request.cookies.getAll();
        },
        setAll(cookiesToSet, headers) {
          cookiesToSet.forEach(({ name, value }) =>
            request.cookies.set(name, value),
          );
          supabaseResponse = NextResponse.next({ request });
          cookiesToSet.forEach(({ name, value, options }) =>
            supabaseResponse.cookies.set(name, value, options),
          );
          Object.entries(headers ?? {}).forEach(([key, value]) =>
            supabaseResponse.headers.set(key, value),
          );
        },
      },
    },
  );

  // Refreshes expired tokens (writes new cookies through setAll) and
  // validates the session. Do not add code between client creation and
  // this call — it desyncs browser and server sessions.
  const { data, error } = await supabase.auth.getClaims();
  const user = error || !data ? null : data;

  const { pathname } = request.nextUrl;
  const isProtected = PROTECTED_PREFIXES.some((prefix) =>
    pathname.startsWith(prefix),
  );
  const isAuthPage = AUTH_PAGES.some((page) => pathname.startsWith(page));

  if (!user && isProtected) {
    const url = request.nextUrl.clone();
    url.pathname = "/login";
    url.searchParams.set("next", pathname);
    return NextResponse.redirect(url);
  }

  if (user && isAuthPage) {
    const url = request.nextUrl.clone();
    url.pathname = "/dashboard";
    url.search = "";
    return NextResponse.redirect(url);
  }

  // Must be returned as-is so refreshed cookies reach the browser.
  return supabaseResponse;
}

export const config = {
  // Exclude static assets; everything else runs through session handling.
  matcher: [
    "/((?!_next/static|_next/image|favicon.ico|.*\\.(?:svg|png|jpg|jpeg|gif|webp|ico)$).*)",
  ],
};
