import { createBrowserClient } from "@supabase/ssr";
import type { Database } from "@/types/database.types";

/**
 * Browser Supabase client (spec 05, REQ-02).
 *
 * Uses only NEXT_PUBLIC_* publishable variables — the secret key never
 * reaches this module (REQ-03). `createBrowserClient` persists the session
 * in cookies so `src/proxy.ts` and server components can read it.
 */
export function createSupabaseBrowserClient() {
  return createBrowserClient<Database>(
    process.env.NEXT_PUBLIC_SUPABASE_URL!,
    process.env.NEXT_PUBLIC_SUPABASE_PUBLISHABLE_KEY!,
  );
}
