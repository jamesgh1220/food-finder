import { createSupabaseAuthPort } from "@/infrastructure/auth/supabase-auth-port";
import { createSupabaseBrowserClient } from "@/infrastructure/supabase/browser-client";
import { createAuthServices, type AuthServices } from "@/lib/composition/auth";

/**
 * Servicios de auth para Client Components (formularios de login/registro
 * y logout). Las cookies de sesión las escribe el propio cliente browser.
 */
export function createBrowserAuthServices(): AuthServices {
  return createAuthServices(createSupabaseAuthPort(createSupabaseBrowserClient()));
}
