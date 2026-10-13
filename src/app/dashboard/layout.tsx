import Link from "next/link";
import { redirect } from "next/navigation";
import { Suspense, type ReactNode } from "react";
import { LogoutButton } from "@/components/auth/logout-button";
import { createServerAuthServices } from "@/lib/composition/server-auth";
import { messages } from "@/lib/i18n/messages";

/**
 * Shared authenticated shell for `/dashboard` and `/dashboard/pantry`
 * (spec 13, REQ-01/REQ-07).
 *
 * The layout stays static: the brand and the pantry nav link are plain links,
 * while the session-dependent part (the user email and the logout button) is
 * pushed behind a `<Suspense>` boundary because it reads `cookies()`. The final
 * URLs remain exactly `/dashboard` and `/dashboard/pantry` — no route groups.
 *
 * Props are typed inline instead of `LayoutProps<"/dashboard">` on purpose: the
 * generated route types are refreshed by `next build`/`next dev`, and typing the
 * static shell by hand keeps `pnpm typecheck` independent of that regeneration.
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
