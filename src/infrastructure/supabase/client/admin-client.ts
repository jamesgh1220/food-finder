import { createClient } from "@supabase/supabase-js";
import type { Database } from "@/types/database.types";

/**
 * Cliente admin de Supabase (spec 05).
 *
 * ADVERTENCIA: módulo EXCLUSIVO de servidor. Se autentica con
 * `SUPABASE_SECRET_KEY` (nunca con una variable NEXT_PUBLIC_*) y concede
 * acceso sin RLS, así que NUNCA debe importarse desde código de cliente:
 * hacerlo filtraría la secret key al navegador. Es el único lugar autorizado
 * del proyecto para crear este cliente.
 *
 * Se desactivan persistencia de sesión y refresco automático porque este
 * cliente opera puntualmente, sin identidad de usuario ni cookies.
 */
export function createSupabaseAdminClient() {
  return createClient<Database>(
    process.env.NEXT_PUBLIC_SUPABASE_URL!,
    process.env.SUPABASE_SECRET_KEY!,
    {
      auth: {
        persistSession: false,
        autoRefreshToken: false,
        detectSessionInUrl: false,
      },
    },
  );
}
