import type { Metadata } from "next";
import Link from "next/link";
import { redirect } from "next/navigation";
import { Suspense } from "react";
import { RecipeCard } from "@/components/recipes/recipe-card";
import {
  RecipeGrid,
  RecipeGridSkeleton,
} from "@/components/recipes/recipe-grid";
import { RecipesFilters } from "@/components/recipes/recipes-filters";
import { EmptyState } from "@/components/shared/empty-state";
import { ErrorState } from "@/components/shared/error-state";
import { LoadingState } from "@/components/shared/loading-state";
import { buttonVariants } from "@/components/ui/button";
import { createServerApplicationServices } from "@/lib/composition/server-application";
import { createServerAuthServices } from "@/lib/composition/server-auth";
import { isMealType, type MealType } from "@/domain/value-objects";
import { UnauthorizedError } from "@/domain/errors";
import { messages } from "@/lib/i18n/messages";
import type { Cuisine } from "@/domain/entities";
import type { RecommendedRecipe } from "@/application/ports/recipe-recommendation";
import { cn } from "@/lib/utils";

export const metadata: Metadata = {
  title: "Recetas | Food Finder",
};

/** Recipes filter params (spec 14, REQ-06; PROMTP #70 — extensible shape). */
type RecipesSearchParams = Record<string, string | string[] | undefined>;

function firstValue(value: string | string[] | undefined): string | undefined {
  return Array.isArray(value) ? value[0] : value;
}

/**
 * Recipes results route (spec 14, REQ-01/REQ-05/REQ-06/REQ-10; PROMTP #42/#71/#72).
 *
 * The destination of **Encontrar recetas**: filters (meal type, cuisine) plus a
 * `RecipeCard` grid where every card explains its match score and lists the
 * available/missing ingredients (Caso 4). The static shell is just a Suspense
 * fallback; everything session- and filter-dependent streams in from
 * `RecipesContent`, so the route still prerenders. `searchParams` is a Promise
 * in Next 16 and resolving it opts the page into request-time rendering. The
 * shared authenticated header lives in `dashboard/layout.tsx`.
 */
export default function RecipesPage({
  searchParams,
}: PageProps<"/dashboard/recipes">) {
  return (
    <Suspense fallback={<RecipesFallback />}>
      <RecipesContent searchParams={searchParams} />
    </Suspense>
  );
}

function RecipesFallback() {
  return (
    <main className="mx-auto w-full max-w-5xl px-6 py-12">
      <LoadingState label={messages.recipesPage.loading} />
      <RecipeGridSkeleton className="mt-8" />
    </main>
  );
}

async function RecipesContent({
  searchParams,
}: {
  searchParams: Promise<RecipesSearchParams>;
}) {
  const params = await searchParams;

  // Second line of defence after `src/proxy.ts`; also the server context where
  // `GetCurrentUser` runs. `redirect` throws, so it is called before any catch.
  const { getCurrentUser } = await createServerAuthServices();
  const authResult = await getCurrentUser.execute();

  if (!authResult.ok || !authResult.data) {
    redirect("/login");
  }

  // Normalize the URL as the single source of truth for the filters.
  const mealTypeRaw = firstValue(params.mealType);
  const mealType: MealType = isMealType(mealTypeRaw) ? mealTypeRaw : "ANY";
  const cuisineRaw = firstValue(params.cuisineId);
  const cuisineId = cuisineRaw && cuisineRaw.length > 0 ? cuisineRaw : null;

  const services = await createServerApplicationServices();

  let pantryIngredientIds: string[] = [];
  let cuisines: Cuisine[] = [];
  let loadFailed = false;

  try {
    const [pantry, cuisineList] = await Promise.all([
      services.getUserPantry.execute(),
      services.getCuisines.execute(),
    ]);
    pantryIngredientIds = pantry.map((item) => item.ingredientId);
    cuisines = cuisineList;
  } catch (error) {
    // A session that expired between the check above and these calls must not
    // degrade to a generic error: send the user back to `/login`.
    if (error instanceof UnauthorizedError) {
      redirect("/login");
    }
    loadFailed = true;
  }

  const hasPantry = pantryIngredientIds.length > 0;

  let recommendations: RecommendedRecipe[] = [];
  let searchFailed = false;
  if (!loadFailed && hasPantry) {
    try {
      recommendations = await services.findRecipesFromPantry.execute({
        ingredientIds: pantryIngredientIds,
        mealType,
        cuisineId,
      });
    } catch (error) {
      if (error instanceof UnauthorizedError) {
        redirect("/login");
      }
      searchFailed = true;
    }
  }

  const cuisineOptions = cuisines.map((cuisine) => ({
    id: cuisine.id,
    name: cuisine.name,
  }));

  return (
    <main className="mx-auto w-full max-w-5xl px-6 py-12">
      <header className="max-w-2xl">
        <h1 className="font-display text-3xl font-semibold leading-tight tracking-tight text-foreground sm:text-4xl">
          {messages.recipesPage.heading}
        </h1>
        <p className="mt-3 leading-relaxed text-muted-foreground text-pretty">
          {messages.recipesPage.subtitle}
        </p>
      </header>

      {loadFailed ? (
        <ErrorState
          className="mt-10"
          title={messages.recipesPage.errorTitle}
          description={messages.recipesPage.errorDescription}
        />
      ) : (
        <>
          <RecipesFilters
            className="mt-8 rounded-lg border border-border bg-card p-6"
            cuisines={cuisineOptions}
            initialMealType={mealType}
            initialCuisineId={cuisineId}
          />

          <div className="mt-10">
            {!hasPantry ? (
              <EmptyState
                title={messages.recipesPage.noPantryTitle}
                description={messages.recipesPage.noPantryDescription}
                action={
                  <Link
                    href="/dashboard/pantry"
                    className={cn(
                      buttonVariants({ variant: "primary", size: "md" }),
                    )}
                  >
                    {messages.dashboard.managePantry}
                  </Link>
                }
              />
            ) : searchFailed ? (
              <ErrorState
                title={messages.recipesPage.errorTitle}
                description={messages.recipesPage.errorDescription}
              />
            ) : recommendations.length === 0 ? (
              <EmptyState
                title={messages.recipesPage.emptyTitle}
                description={messages.recipesPage.emptyDescription}
                action={
                  <Link
                    href="/dashboard/pantry"
                    className={cn(
                      buttonVariants({ variant: "secondary", size: "md" }),
                    )}
                  >
                    {messages.dashboard.managePantry}
                  </Link>
                }
              />
            ) : (
              <RecipeGrid>
                {recommendations.map((recommendation) => (
                  <RecipeCard
                    key={recommendation.recipe.id}
                    recipe={recommendation.recipe}
                    matchScore={recommendation.matchScore.value}
                    availableIngredients={recommendation.availableIngredients}
                    missingIngredients={recommendation.missingIngredients}
                    optionalMissingIngredients={
                      recommendation.optionalMissingIngredients
                    }
                    href={`/dashboard/recipes/${recommendation.recipe.id}`}
                  />
                ))}
              </RecipeGrid>
            )}
          </div>
        </>
      )}
    </main>
  );
}
