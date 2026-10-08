import { createSupabaseAuthPort } from "@/infrastructure/auth/supabase-auth-port";
import { createSupabaseServerClient } from "@/infrastructure/supabase/server-client";
import { createAuthServices, type AuthServices } from "@/lib/composition/auth";

/**
 * Servicios de auth para Server Components / Route Handlers (p. ej.
 * `/dashboard` resolviendo el usuario de la sesión). Solo server:
 * importa `next/headers`.
 */
export async function createServerAuthServices(): Promise<AuthServices> {
  const client = await createSupabaseServerClient();
  return createAuthServices(createSupabaseAuthPort(client));
}
