import type { Metadata } from "next";
import Image from "next/image";
import Link from "next/link";
import { redirect } from "next/navigation";
import { Suspense } from "react";
import { FavoriteToggle } from "@/components/favorites/favorite-toggle";
import { MissingIngredients } from "@/components/recipes/missing-ingredients";
import {
  RecipeIngredients,
  type RecipeIngredientView,
} from "@/components/recipes/recipe-ingredients";
import { RecipeInstructions } from "@/components/recipes/recipe-instructions";
import { RecipeMatchScore } from "@/components/recipes/recipe-match-score";
import { EmptyState } from "@/components/shared/empty-state";
import { ErrorState } from "@/components/shared/error-state";
import { LoadingState } from "@/components/shared/loading-state";
import { Badge } from "@/components/ui/badge";
import { buttonVariants } from "@/components/ui/button";
import { createServerApplicationServices } from "@/lib/composition/server-application";
import { createServerAuthServices } from "@/lib/composition/server-auth";
import { NotFoundError, UnauthorizedError } from "@/domain/errors";
import {
  difficultyLabels,
  mealTypeLabels,
  messages,
  recipeSourceLabels,
} from "@/lib/i18n/messages";
import type { Recipe, RecipeIngredientDetail } from "@/domain/entities";
import type { RecommendedRecipe } from "@/application/ports/recipe-recommendation";
import { cn } from "@/lib/utils";

export const metadata: Metadata = {
  title: "Receta | Food Finder",
};

/** Metadata row rendered in the detail definition list. */
interface MetaEntry {
  label: string;
  value: string;
}

/**
 * Recipe detail route (spec 14, REQ-02/REQ-05/REQ-07/REQ-08/REQ-09/REQ-10;
 * PROMTP #43/#71/#72).
 *
 * Server Component: resolves the recipe, its ingredients with quantities, its
 * cuisine name and the session's favorite state directly through the use cases
 * (hop rule, spec 02). The match score reuses the recommendation engine
 * (`FindRecipesFromPantry`) and looks the recipe up in its results; when the
 * recipe is absent — an externally generated recipe that has no ingredient rows,
 * or an empty pantry — the whole match block is omitted, the graceful
 * degradation required by REQ-09 and spec 09. The favorite toggle goes through
 * the favorites Server Actions, never through `/api/*`.
 */
export default function RecipeDetailPage({
  params,
}: PageProps<"/dashboard/recipes/[id]">) {
  return (
    <Suspense fallback={<RecipeDetailFallback />}>
      <RecipeDetailContent params={params} />
    </Suspense>
  );
}

function RecipeDetailFallback() {
  return (
    <main className="mx-auto w-full max-w-3xl px-6 py-12">
      <LoadingState label={messages.recipeDetail.loading} />
    </main>
  );
}

/** In-page not-found state; a missing id never degrades into a generic error. */
function RecipeNotFound() {
  return (
    <main className="mx-auto w-full max-w-3xl px-6 py-12">
      <BackToRecipes />
      <EmptyState
        className="mt-8"
        title={messages.recipeDetail.notFoundTitle}
        description={messages.recipeDetail.notFoundDescription}
        action={
          <Link
            href="/dashboard/recipes"
            className={cn(buttonVariants({ variant: "secondary", size: "md" }))}
          >
            {messages.recipeDetail.backLink}
          </Link>
        }
      />
    </main>
  );
}

/** Decorative bowl-with-steam glyph for recipes without an image. */
function RecipeImagePlaceholder() {
  return (
    <div
      className="flex h-full w-full items-center justify-center bg-accent"
      aria-hidden="true"
    >
      <svg
        className="h-16 w-16 text-accent-foreground/70"
        viewBox="0 0 48 48"
        fill="none"
        stroke="currentColor"
        strokeWidth="2"
        strokeLinecap="round"
        strokeLinejoin="round"
      >
        <path d="M8 24h32" />
        <path d="M10 24c0 9 28 9 28 0" />
        <path d="M19 9v6" />
        <path d="M29 9v6" />
      </svg>
    </div>
  );
}

function BackToRecipes() {
  return (
    <Link
      href="/dashboard/recipes"
      className="inline-flex items-center gap-1.5 rounded-sm text-sm text-muted-foreground outline-none transition-colors hover:text-foreground focus-visible:ring-2 focus-visible:ring-ring/40"
    >
      <svg
        className="h-4 w-4"
        viewBox="0 0 16 16"
        fill="none"
        stroke="currentColor"
        strokeWidth="1.6"
        strokeLinecap="round"
        strokeLinejoin="round"
        aria-hidden="true"
      >
        <path d="M9.5 3.5 5 8l4.5 4.5" />
        <path d="M5 8h8" />
      </svg>
      {messages.recipeDetail.backLink}
    </Link>
  );
}

/** Map the read model to the presentational ingredient view, dropping nulls. */
function toIngredientViews(
  ingredients: RecipeIngredientDetail[],
): RecipeIngredientView[] {
  return ingredients.map((ingredient) => ({
    name: ingredient.name,
    quantity: ingredient.quantity ?? undefined,
    unit: ingredient.unit ?? undefined,
    optional: ingredient.optional,
    notes: ingredient.notes,
  }));
}

/** Build the ordered metadata rows, omitting the fields the recipe lacks. */
function buildMeta(
  recipe: Recipe,
  cuisineName: string | null,
): MetaEntry[] {
  const meta: MetaEntry[] = [];

  if (cuisineName) {
    meta.push({ label: messages.recipeDetail.cuisine, value: cuisineName });
  }
  if (recipe.country) {
    meta.push({ label: messages.recipeDetail.country, value: recipe.country });
  }
  if (recipe.region) {
    meta.push({ label: messages.recipeDetail.region, value: recipe.region });
  }

  const totalMinutes = recipe.cookingTime
    ? recipe.preparationTime + recipe.cookingTime
    : recipe.preparationTime;
  meta.push({
    label: messages.recipeDetail.time,
    value: messages.recipeDetail.minutes(totalMinutes),
  });
  meta.push({
    label: messages.recipeDetail.servings,
    value: messages.recipeDetail.servingsValue(recipe.servings),
  });

  if (recipe.difficulty) {
    meta.push({
      label: messages.recipeDetail.difficulty,
      value: difficultyLabels[recipe.difficulty],
    });
  }

  meta.push({
    label: messages.recipeDetail.source,
    value: recipeSourceLabels[recipe.source] ?? recipe.source,
  });

  return meta;
}

async function RecipeDetailContent({
  params,
}: {
  params: Promise<{ id: string }>;
}) {
  const { id } = await params;

  // Second line of defence after `src/proxy.ts`; also the server context where
  // `GetCurrentUser` runs. `redirect` throws, so it is called before any catch.
  const { getCurrentUser } = await createServerAuthServices();
  const authResult = await getCurrentUser.execute();

  if (!authResult.ok || !authResult.data) {
    redirect("/login");
  }

  const services = await createServerApplicationServices();

  let recipe: Recipe | null = null;
  let loadFailed = false;

  try {
    recipe = await services.getRecipeById.execute({ id });
  } catch (error) {
    if (error instanceof UnauthorizedError) {
      redirect("/login");
    }
    if (error instanceof NotFoundError) {
      return <RecipeNotFound />;
    }
    loadFailed = true;
  }

  const loadedRecipe = recipe;

  let ingredients: RecipeIngredientDetail[] = [];
  let cuisineName: string | null = null;
  let isFavorite = false;
  let match: RecommendedRecipe | undefined;

  if (!loadFailed && loadedRecipe) {
    try {
      const [ingredientList, cuisine, favorites, pantry] = await Promise.all([
        services.getRecipeIngredients.execute({ recipeId: loadedRecipe.id }),
        services.getCuisineById
          .execute({ id: loadedRecipe.cuisineId })
          .catch(() => null),
        services.getFavoriteRecipes.execute(),
        services.getUserPantry.execute(),
      ]);

      ingredients = ingredientList;
      cuisineName = cuisine?.name ?? null;
      isFavorite = favorites.some(
        (favorite) => favorite.id === loadedRecipe.id,
      );

      const pantryIngredientIds = pantry.map((item) => item.ingredientId);
      // Only score when the pantry has something to match against: running the
      // engine with an empty pantry would trigger the external provider for no
      // benefit. No meal-type/cuisine filter is passed so the recipe is never
      // filtered out of its own result set (the score ignores those filters).
      if (pantryIngredientIds.length > 0) {
        const recommendations =
          await services.findRecipesFromPantry.execute({
            ingredientIds: pantryIngredientIds,
          });
        match = recommendations.find(
          (recommendation) => recommendation.recipe.id === loadedRecipe.id,
        );
      }
    } catch (error) {
      if (error instanceof UnauthorizedError) {
        redirect("/login");
      }
      loadFailed = true;
    }
  }

  if (loadFailed || !loadedRecipe) {
    return (
      <main className="mx-auto w-full max-w-3xl px-6 py-12">
        <BackToRecipes />
        <ErrorState
          className="mt-8"
          title={messages.recipeDetail.errorTitle}
          description={messages.recipeDetail.errorDescription}
        />
      </main>
    );
  }

  const ingredientViews = toIngredientViews(ingredients);
  const meta = buildMeta(loadedRecipe, cuisineName);
  const hasInstructions = loadedRecipe.instructions.trim().length > 0;
  const hasMissing =
    match !== undefined &&
    (match.missingIngredients.length > 0 ||
      match.optionalMissingIngredients.length > 0);

  return (
    <main className="mx-auto w-full max-w-3xl px-6 py-12">
      <BackToRecipes />

      <article className="mt-6">
        <header>
          <div className="flex flex-wrap items-center gap-1.5">
            <Badge>{mealTypeLabels[loadedRecipe.mealType]}</Badge>
            {loadedRecipe.difficulty ? (
              <Badge variant="outline">
                {difficultyLabels[loadedRecipe.difficulty]}
              </Badge>
            ) : null}
            <Badge variant="accent">
              {recipeSourceLabels[loadedRecipe.source] ?? loadedRecipe.source}
            </Badge>
          </div>

          <h1 className="mt-4 font-display text-3xl font-semibold leading-tight tracking-tight text-foreground sm:text-4xl">
            {loadedRecipe.name}
          </h1>

          {loadedRecipe.description ? (
            <p className="mt-3 leading-relaxed text-muted-foreground text-pretty">
              {loadedRecipe.description}
            </p>
          ) : null}
        </header>

        <div className="mt-6 overflow-hidden rounded-lg border border-border bg-secondary">
          <div className="relative aspect-[16/9] w-full">
            {loadedRecipe.imageUrl ? (
              <Image
                src={loadedRecipe.imageUrl}
                alt={loadedRecipe.name}
                fill
                sizes="(max-width: 768px) 100vw, 768px"
                className="object-cover"
              />
            ) : (
              <RecipeImagePlaceholder />
            )}
          </div>
        </div>

        <div className="mt-6">
          <FavoriteToggle
            recipeId={loadedRecipe.id}
            isFavorite={isFavorite}
            recipeName={loadedRecipe.name}
          />
        </div>

        <dl className="mt-8 grid grid-cols-2 gap-x-6 gap-y-5 sm:grid-cols-3">
          {meta.map((entry) => (
            <div key={entry.label} className="flex flex-col gap-1">
              <dt className="text-xs font-medium uppercase tracking-wide text-muted-foreground">
                {entry.label}
              </dt>
              <dd className="text-sm text-foreground">{entry.value}</dd>
            </div>
          ))}
        </dl>

        {match ? (
          <section className="mt-10 rounded-lg border border-border bg-card p-6">
            <h2 className="font-display text-lg font-semibold tracking-tight text-foreground">
              {messages.recipeDetail.matchTitle}
            </h2>

            <RecipeMatchScore
              className="mt-4"
              score={match.matchScore.value}
              variant="percentage"
            />

            {match.availableIngredients.length > 0 ? (
              <div className="mt-5 flex flex-col gap-2">
                <span className="text-xs font-medium uppercase tracking-wide text-muted-foreground">
                  {messages.recipes.availableLabel}
                </span>
                <ul className="flex flex-wrap items-center gap-1.5">
                  {match.availableIngredients.map((name) => (
                    <li key={name}>
                      <Badge variant="accent">{name}</Badge>
                    </li>
                  ))}
                </ul>
              </div>
            ) : null}

            {hasMissing ? (
              <MissingIngredients
                className="mt-5"
                missing={match.missingIngredients}
                optionalMissing={match.optionalMissingIngredients}
                title={messages.recipes.missingLabel}
              />
            ) : null}
          </section>
        ) : null}

        <section className="mt-10">
          <h2 className="font-display text-xl font-semibold tracking-tight text-foreground">
            {messages.recipeDetail.ingredients}
          </h2>
          {ingredientViews.length > 0 ? (
            <RecipeIngredients
              className="mt-4"
              ingredients={ingredientViews}
            />
          ) : (
            <p className="mt-4 text-sm leading-relaxed text-muted-foreground">
              {messages.recipeDetail.noIngredients}
            </p>
          )}
        </section>

        {hasInstructions ? (
          <section className="mt-10">
            <h2 className="font-display text-xl font-semibold tracking-tight text-foreground">
              {messages.recipeDetail.instructions}
            </h2>
            <RecipeInstructions
              className="mt-4"
              instructions={loadedRecipe.instructions}
            />
          </section>
        ) : null}
      </article>
    </main>
  );
}
