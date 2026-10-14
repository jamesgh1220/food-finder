import type { Metadata } from "next";
import Link from "next/link";
import { redirect } from "next/navigation";
import { Suspense } from "react";
import { DashboardControls } from "@/components/dashboard";
import { EmptyState } from "@/components/shared/empty-state";
import { ErrorState } from "@/components/shared/error-state";
import { LoadingState } from "@/components/shared/loading-state";
import { Badge } from "@/components/ui/badge";
import { buttonVariants } from "@/components/ui/button";
import { createServerApplicationServices } from "@/lib/composition/server-application";
import { createServerAuthServices } from "@/lib/composition/server-auth";
import { messages } from "@/lib/i18n/messages";
import { isMealType, type MealType } from "@/domain/value-objects";
import { UnauthorizedError } from "@/domain/errors";
import type { Cuisine, Ingredient, PantryItem } from "@/domain/entities";
import { cn } from "@/lib/utils";

export const metadata: Metadata = {
  title: "Dashboard | Food Finder",
};

/** Dashboard filter params (spec 13, REQ-06; PROMTP #70 — extensible shape). */
type DashboardSearchParams = Record<string, string | string[] | undefined>;

function firstValue(value: string | string[] | undefined): string | undefined {
  return Array.isArray(value) ? value[0] : value;
}

/**
 * Protected dashboard route (spec 13, REQ-01; PROMTP #40).
 *
 * The static shell is just a Suspense fallback; everything session- or
 * request-dependent streams in from `DashboardContent`. `searchParams` is a
 * Promise in Next 16 (page.md) and resolving it opts the page into request-time
 * rendering. The shared header lives in `dashboard/layout.tsx`.
 *
 * Spec 14 moved the recommendation results to `/dashboard/recipes`: this route is
 * now the search entry only (greeting, meal type, pantry chips, cuisine and the
 * **Encontrar recetas** button, which submits to the results route).
 */
export default function DashboardPage({
  searchParams,
}: PageProps<"/dashboard">) {
  return (
    <Suspense fallback={<DashboardFallback />}>
      <DashboardContent searchParams={searchParams} />
    </Suspense>
  );
}

function DashboardFallback() {
  return (
    <main className="mx-auto w-full max-w-5xl px-6 py-20">
      <LoadingState label={messages.dashboard.loading} />
    </main>
  );
}

async function DashboardContent({
  searchParams,
}: {
  searchParams: Promise<DashboardSearchParams>;
}) {
  const params = await searchParams;

  // Second line of defence after `src/proxy.ts`; also the server context where
  // `GetCurrentUser` runs. `redirect` throws, so it is called before any catch.
  const { getCurrentUser } = await createServerAuthServices();
  const authResult = await getCurrentUser.execute();

  if (!authResult.ok || !authResult.data) {
    redirect("/login");
  }

  const user = authResult.data;
  const displayName = user.email.split("@")[0];

  // Normalize the URL as the single source of truth for the filters.
  const mealTypeRaw = firstValue(params.mealType);
  const mealType: MealType = isMealType(mealTypeRaw) ? mealTypeRaw : "ANY";
  const cuisineRaw = firstValue(params.cuisineId);
  const cuisineId = cuisineRaw && cuisineRaw.length > 0 ? cuisineRaw : null;

  const services = await createServerApplicationServices();

  let pantryItems: PantryItem[] = [];
  let cuisines: Cuisine[] = [];
  let ingredients: Ingredient[] = [];
  let loadFailed = false;

  try {
    const [pantry, cuisineList, ingredientList] = await Promise.all([
      services.getUserPantry.execute(),
      services.getCuisines.execute(),
      services.searchIngredients.execute({}),
    ]);
    pantryItems = pantry;
    cuisines = cuisineList;
    ingredients = ingredientList;
  } catch (error) {
    // A session that expired between the check above and these calls must not
    // degrade to a generic error: send the user back to `/login`.
    if (error instanceof UnauthorizedError) {
      redirect("/login");
    }
    loadFailed = true;
  }

  // Name gap: PantryItem carries only `ingredientId`, so the display names are
  // resolved once from the ingredient catalog.
  const ingredientNames = new Map(
    ingredients.map((ingredient) => [ingredient.id, ingredient.name]),
  );
  const pantryChips = pantryItems.map((item) => ({
    id: item.ingredientId,
    name: ingredientNames.get(item.ingredientId) ?? messages.pantry.unknownIngredient,
  }));
  const cuisineOptions = cuisines.map((cuisine) => ({
    id: cuisine.id,
    name: cuisine.name,
  }));

  return (
    <main className="mx-auto w-full max-w-5xl px-6 py-12">
      <header className="max-w-2xl">
        <p className="text-sm font-medium text-accent-foreground">
          {messages.dashboard.greeting(displayName)}
        </p>
        <h1 className="mt-2 font-display text-3xl font-semibold leading-tight tracking-tight text-foreground sm:text-4xl">
          {messages.dashboard.heading}
        </h1>
        <p className="mt-3 leading-relaxed text-muted-foreground text-pretty">
          {messages.dashboard.subtitle}
        </p>
      </header>

      {loadFailed ? (
        <ErrorState
          className="mt-10"
          title={messages.dashboard.error.title}
          description={messages.dashboard.error.description}
        />
      ) : (
        <>
          <DashboardControls
            className="mt-8 rounded-lg border border-border bg-card p-6"
            cuisines={cuisineOptions}
            initialMealType={mealType}
            initialCuisineId={cuisineId}
          />

          <section className="mt-12">
            <div className="flex flex-wrap items-center justify-between gap-3">
              <h2 className="font-display text-xl font-semibold tracking-tight text-foreground">
                {messages.dashboard.pantrySection}
              </h2>
              <Link
                href="/dashboard/pantry"
                className={cn(buttonVariants({ variant: "secondary", size: "sm" }))}
              >
                {messages.dashboard.managePantry}
              </Link>
            </div>

            {pantryChips.length > 0 ? (
              <ul className="mt-4 flex flex-wrap items-center gap-2">
                {pantryChips.map((chip) => (
                  <li key={chip.id}>
                    <Badge variant="accent">{chip.name}</Badge>
                  </li>
                ))}
              </ul>
            ) : (
              <EmptyState
                className="mt-4"
                title={messages.pantry.emptyTitle}
                description={messages.pantry.emptyDescription}
                action={
                  <Link
                    href="/dashboard/pantry"
                    className={cn(buttonVariants({ variant: "primary", size: "md" }))}
                  >
                    {messages.dashboard.managePantry}
                  </Link>
                }
              />
            )}
          </section>
        </>
      )}
    </main>
  );
}
