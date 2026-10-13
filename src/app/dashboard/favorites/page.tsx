import type { Metadata } from "next";
import Link from "next/link";
import { redirect } from "next/navigation";
import { Suspense } from "react";
import { FavoritesList } from "@/components/favorites/favorites-list";
import { EmptyState } from "@/components/shared/empty-state";
import { ErrorState } from "@/components/shared/error-state";
import { LoadingState } from "@/components/shared/loading-state";
import { buttonVariants } from "@/components/ui/button";
import { createServerApplicationServices } from "@/lib/composition/server-application";
import { createServerAuthServices } from "@/lib/composition/server-auth";
import { UnauthorizedError } from "@/domain/errors";
import { messages } from "@/lib/i18n/messages";
import type { Recipe } from "@/domain/entities";
import { cn } from "@/lib/utils";

export const metadata: Metadata = {
  title: "Favoritos | Food Finder",
};

/**
 * Favorites route (spec 14, REQ-03/REQ-08/REQ-10; PROMTP #44; Caso 6).
 *
 * Server Component: loads the session's saved recipes through
 * `GetFavoriteRecipes` (never through `/api/*`, hop rule spec 02) and serializes
 * them for the `FavoritesList` client container, which owns the local search and
 * the persistent removal. The shared authenticated header lives in
 * `dashboard/layout.tsx`.
 */
export default function FavoritesPage() {
  return (
    <Suspense fallback={<FavoritesFallback />}>
      <FavoritesContent />
    </Suspense>
  );
}

function FavoritesFallback() {
  return (
    <main className="mx-auto w-full max-w-5xl px-6 py-12">
      <LoadingState label={messages.favorites.loading} />
    </main>
  );
}

async function FavoritesContent() {
  // Second line of defence after `src/proxy.ts`; also the server context where
  // `GetCurrentUser` runs. `redirect` throws, so it is called before any catch.
  const { getCurrentUser } = await createServerAuthServices();
  const authResult = await getCurrentUser.execute();

  if (!authResult.ok || !authResult.data) {
    redirect("/login");
  }

  const services = await createServerApplicationServices();

  let recipes: Recipe[] = [];
  let loadFailed = false;

  try {
    recipes = await services.getFavoriteRecipes.execute();
  } catch (error) {
    // A session that expired between the check above and this call must not
    // degrade to a generic error: send the user back to `/login`.
    if (error instanceof UnauthorizedError) {
      redirect("/login");
    }
    loadFailed = true;
  }

  return (
    <main className="mx-auto w-full max-w-5xl px-6 py-12">
      <header className="max-w-2xl">
        <h1 className="font-display text-3xl font-semibold leading-tight tracking-tight text-foreground sm:text-4xl">
          {messages.favorites.heading}
        </h1>
        <p className="mt-3 leading-relaxed text-muted-foreground text-pretty">
          {messages.favorites.subtitle}
        </p>
      </header>

      <div className="mt-8">
        {loadFailed ? (
          <ErrorState
            title={messages.favorites.errorTitle}
            description={messages.favorites.errorDescription}
          />
        ) : recipes.length === 0 ? (
          <EmptyState
            title={messages.favorites.emptyTitle}
            description={messages.favorites.emptyDescription}
            action={
              <Link
                href="/dashboard/recipes"
                className={cn(
                  buttonVariants({ variant: "primary", size: "md" }),
                )}
              >
                {messages.dashboard.recipesNav}
              </Link>
            }
          />
        ) : (
          <FavoritesList recipes={recipes} />
        )}
      </div>
    </main>
  );
}
