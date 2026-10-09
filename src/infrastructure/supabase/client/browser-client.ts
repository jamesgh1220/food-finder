import { createBrowserClient } from "@supabase/ssr";
import type { Database } from "@/types/database.types";

/**
 * Cliente Supabase de navegador (spec 05, REQ-02).
 *
 * Usa solo variables publicables NEXT_PUBLIC_* — la secret key nunca
 * llega a este módulo (REQ-03). `createBrowserClient` persiste la sesión
 * en cookies para que `src/proxy.ts` y los Server Components puedan leerla.
 */
export function createSupabaseBrowserClient() {
  return createBrowserClient<Database>(
    process.env.NEXT_PUBLIC_SUPABASE_URL!,
    process.env.NEXT_PUBLIC_SUPABASE_PUBLISHABLE_KEY!,
  );
}
