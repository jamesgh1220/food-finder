import type { Metadata } from "next";
import { redirect } from "next/navigation";
import { Suspense } from "react";
import { LogoutButton } from "@/components/auth/logout-button";
import { createServerAuthServices } from "@/lib/composition/server-auth";

export const metadata: Metadata = {
  title: "Dashboard | Food Finder",
};

/**
 * Ruta protegida (spec 05, REQ-05). `src/proxy.ts` ya redirige las
 * peticiones no autenticadas; esta comprobación en server es la segunda
 * línea de defensa y el lugar donde `GetCurrentUser` corre en contexto
 * server.
 *
 * Next 16 Cache Components: leer `cookies()` debe estar detrás de un
 * límite `<Suspense>`, así el contenido autenticado entra en streaming
 * en tiempo de petición y el shell se mantiene estático (docs:
 * authentication-with-cache-components).
 */
export default function DashboardPage() {
  return (
    <div className="flex min-h-screen flex-col bg-background font-sans">
      <Suspense
        fallback={
          <div className="flex min-h-screen flex-col">
            <div className="border-b border-border bg-card">
              <div className="mx-auto flex w-full max-w-5xl items-center justify-between px-6 py-4">
                <span className="text-lg font-display font-medium tracking-tight text-primary">
                  Food Finder
                </span>
              </div>
            </div>
            <main className="mx-auto w-full max-w-5xl px-6 py-20">
              <p className="text-sm text-muted-foreground">Cargando…</p>
            </main>
          </div>
        }
      >
        <AuthenticatedDashboard />
      </Suspense>
    </div>
  );
}

async function AuthenticatedDashboard() {
  const { getCurrentUser } = await createServerAuthServices();
  const result = await getCurrentUser.execute();

  if (!result.ok || !result.data) {
    redirect("/login");
  }

  const user = result.data;

  return (
    <>
      <header className="border-b border-border bg-card">
        <div className="mx-auto flex w-full max-w-5xl items-center justify-between px-6 py-4">
          <span className="text-lg font-display font-medium tracking-tight text-primary">
            Food Finder
          </span>
          <div className="flex items-center gap-4">
            <span className="hidden text-sm text-muted-foreground sm:inline">
              {user.email}
            </span>
            <LogoutButton />
          </div>
        </div>
      </header>

      <main className="mx-auto w-full max-w-5xl px-6 py-20">
        <h1 className="max-w-2xl text-4xl sm:text-5xl font-display font-medium leading-tight tracking-tight">
          ¿Qué puedo cocinar con lo que tengo?
        </h1>
        <p className="mt-3 max-w-xl leading-relaxed text-muted-foreground">
          Tu despensa y tus recetas favoritas aparecerán aquí.
        </p>
      </main>
    </>
  );
}
