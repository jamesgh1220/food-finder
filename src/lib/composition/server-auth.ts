import { createSupabaseAuthPort } from "@/infrastructure/auth/supabase-auth-port";
import { createSupabaseServerClient } from "@/infrastructure/supabase/server-client";
import { createAuthServices, type AuthServices } from "@/lib/composition/auth";

/**
 * Auth services for Server Components / Route Handlers (e.g. /dashboard
 * resolving the current session user). Server-only: imports `next/headers`.
 */
export async function createServerAuthServices(): Promise<AuthServices> {
  const client = await createSupabaseServerClient();
  return createAuthServices(createSupabaseAuthPort(client));
}
