import { createServerClient } from "@supabase/ssr";
import { NextResponse, type NextRequest } from "next/server";
import type { Database } from "@/types/database.types";

/**
 * Manejo de sesiones de Supabase + Next.js (spec 05, REQ-06).
 *
 * Next.js 16 renombró la convención de middleware a `proxy` (middleware.ts
 * está deprecado). Guía actual de Supabase: refrescar el token aquí, antes
 * de renderizar cualquier ruta, propagar las cookies refrescadas a la
 * respuesta y redirigir a los usuarios no autenticados fuera de las rutas
 * protegidas.
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

  // Refresca tokens expirados (escribe cookies nuevas vía setAll) y
  // valida la sesión. No pongas código entre la creación del cliente y
  // esta llamada: desincroniza las sesiones de navegador y servidor.
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

  // Debe devolverse tal cual para que las cookies refrescadas lleguen al navegador.
  return supabaseResponse;
}

export const config = {
  // Excluye estáticos; todo lo demás pasa por el manejo de sesiones.
  matcher: [
    "/((?!_next/static|_next/image|favicon.ico|.*\\.(?:svg|png|jpg|jpeg|gif|webp|ico)$).*)",
  ],
};
