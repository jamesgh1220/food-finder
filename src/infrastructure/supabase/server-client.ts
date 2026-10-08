import { cookies } from "next/headers";
import { createServerClient } from "@supabase/ssr";
import type { Database } from "@/types/database.types";

/**
 * Cliente Supabase de server para Server Components, Route Handlers y
 * Server Actions (spec 05, REQ-02/REQ-06).
 *
 * Lee/escribe las cookies de la petición para que la sesión se mantenga
 * sincronizada con el navegador. Escribir cookies desde un Server
 * Component lanza un error — `src/proxy.ts` es quien persiste de verdad
 * los tokens refrescados, de ahí el guard. Aquí solo se usan valores
 * publicables NEXT_PUBLIC_* (REQ-03).
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
            // Se ejecuta al renderizar un Server Component: el proxy ya
            // refrescó las cookies de esta petición; ignorar es seguro.
          }
        },
      },
    },
  );
}
