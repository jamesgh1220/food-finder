import { createSupabaseAuthPort } from "@/infrastructure/auth/supabase-auth-port";
import { createSupabaseBrowserClient } from "@/infrastructure/supabase/browser-client";
import { createAuthServices, type AuthServices } from "@/lib/composition/auth";

/**
 * Auth services for Client Components (login/register/logout forms).
 * Session cookies are written by the browser client itself.
 */
export function createBrowserAuthServices(): AuthServices {
  return createAuthServices(createSupabaseAuthPort(createSupabaseBrowserClient()));
}
