import Link from "next/link";
import { redirect } from "next/navigation";
import { Suspense, type ReactNode } from "react";
import { LogoutButton } from "@/components/auth/logout-button";
import { createServerAuthServices } from "@/lib/composition/server-auth";
import { messages } from "@/lib/i18n/messages";

/**
 * Shared authenticated shell for the `/dashboard/*` routes (spec 13, REQ-01/REQ-07;
 * spec 14, REQ-01/REQ-03).
 *
 * The layout stays static: the brand and the nav links (despensa, recetas,
 * favoritos) are plain links, while the session-dependent part (the user email
 * and the logout button) is pushed behind a `<Suspense>` boundary because it
 * reads `cookies()`. The final URLs remain exactly `/dashboard`,
 * `/dashboard/pantry`, `/dashboard/recipes` and `/dashboard/favorites` — no
 * route groups.
 *
 * Props are typed inline rather than with `LayoutProps<"/dashboard">`. Like the
 * root layout (`src/app/layout.tsx`) and `dashboard/page.tsx`, the generated
 * route types come from `.next/types`, so `pnpm typecheck` expects a prior
 * `next dev`/`next build` in the workspace either way.
 */
export default function DashboardLayout({ children }: { children: ReactNode }) {
  return (
    <div className="flex min-h-screen flex-col bg-background font-sans">
      <Suspense fallback={<DashboardHeaderShell />}>
        <AuthenticatedHeader />
      </Suspense>
      {children}
    </div>
  );
}

/** Static header shell rendered while the session streams in. */
function DashboardHeaderShell() {
  return (
    <header className="border-b border-border bg-card">
      <div className="mx-auto flex w-full max-w-5xl items-center justify-between gap-4 px-6 py-4">
        <span className="text-lg font-display font-medium tracking-tight text-primary">
          {messages.appName}
        </span>
      </div>
    </header>
  );
}

/** Request-time header that resolves the session and renders the user chrome. */
async function AuthenticatedHeader() {
  const { getCurrentUser } = await createServerAuthServices();
  const result = await getCurrentUser.execute();

  if (!result.ok || !result.data) {
    redirect("/login");
  }

  const user = result.data;

  return (
    <header className="border-b border-border bg-card">
      <div className="mx-auto flex w-full max-w-5xl items-center justify-between gap-4 px-6 py-4">
        <div className="flex items-center gap-6">
          <Link
            href="/dashboard"
            className="rounded-sm text-lg font-display font-medium tracking-tight text-primary outline-none focus-visible:ring-2 focus-visible:ring-ring/40"
          >
            {messages.appName}
          </Link>
          <Link
            href="/dashboard/pantry"
            className="rounded-sm text-sm text-muted-foreground outline-none transition-colors hover:text-foreground focus-visible:ring-2 focus-visible:ring-ring/40"
          >
            {messages.dashboard.pantryNav}
          </Link>
          <Link
            href="/dashboard/recipes"
            className="rounded-sm text-sm text-muted-foreground outline-none transition-colors hover:text-foreground focus-visible:ring-2 focus-visible:ring-ring/40"
          >
            {messages.dashboard.recipesNav}
          </Link>
          <Link
            href="/dashboard/favorites"
            className="rounded-sm text-sm text-muted-foreground outline-none transition-colors hover:text-foreground focus-visible:ring-2 focus-visible:ring-ring/40"
          >
            {messages.favorites.nav}
          </Link>
        </div>
        <div className="flex items-center gap-4">
          <span className="hidden text-sm text-muted-foreground sm:inline">
            {user.email}
          </span>
          <LogoutButton />
        </div>
      </div>
    </header>
  );
}
