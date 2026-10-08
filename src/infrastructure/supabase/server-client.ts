import { cookies } from "next/headers";
import { createServerClient } from "@supabase/ssr";
import type { Database } from "@/types/database.types";

/**
 * Server Supabase client for Server Components, Route Handlers and Server
 * Actions (spec 05, REQ-02/REQ-06).
 *
 * Reads/writes the request cookies so the session stays in sync with the
 * browser. Cookie writes from a Server Component throw — `src/proxy.ts` is
 * the component that actually persists refreshed tokens, hence the guard.
 * Only publishable NEXT_PUBLIC_* values are used here (REQ-03).
 */
export async function createSupabaseServerClient() {
  const cookieStore = await cookies();

  return createServerClient<Database>(
    process.env.NEXT_PUBLIC_SUPABASE_URL!,
    process.env.NEXT_PUBLIC_SUPABASE_PUBLISHABLE_KEY!,
    {
      cookies: {
        getAll() {
          return cookieStore.getAll();
        },
        setAll(cookiesToSet) {
          try {
            cookiesToSet.forEach(({ name, value, options }) =>
              cookieStore.set(name, value, options),
            );
          } catch {
            // Called while rendering a Server Component: the proxy already
            // refreshed the cookies for this request; safe to ignore.
          }
        },
      },
    },
  );
}
