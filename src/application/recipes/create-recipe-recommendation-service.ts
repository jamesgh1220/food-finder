import type { RecipeRecommendationService } from "@/application/ports/recipe-recommendation";
import type {
  RecipeRecommendationCatalog,
  RecipeRecommendationRequest,
  RecommendedRecipe,
} from "@/application/ports/recipe-recommendation";
import type { ExternalRecipeProvider } from "@/application/ports/external-recipe-provider";
import type { IngredientRepository } from "@/domain/ports";
import type { CuisineRepository } from "@/domain/ports";
import type {
  RecipeRecommendationCandidate,
  RecipeRecommendationIngredient,
} from "@/domain/entities";
import { normalizeIngredientName } from "@/domain/normalization/ingredient-normalizer";
import { RecipeMatchScore } from "@/domain/value-objects";

export interface RecipeRecommendationServiceDependencies {
  catalog: RecipeRecommendationCatalog;
  ingredients: IngredientRepository;
  cuisines: CuisineRepository;
  externalProvider?: ExternalRecipeProvider;
}

const INTERNAL_MATCH_THRESHOLD = 0.8;

function normalizeRecipeKey(name: string): string {
  return name
    .normalize("NFD")
    .replace(/[\u0300-\u036f]/g, "")
    .toLowerCase()
    .replace(/[^a-z0-9]+/g, " ")
    .trim();
}

function scoreCandidate(
  candidate: RecipeRecommendationCandidate,
  availableIds: Set<string>,
  availableNames: Set<string>,
  catalogByName: Map<string, { id: string; isPantryStaple: boolean }>,
): RecommendedRecipe {
  const ingredients = candidate.ingredients.map((ingredient) => {
    const normalizedName = normalizeIngredientName(
      ingredient.normalizedName || ingredient.name,
    );
    const catalogIngredient = catalogByName.get(normalizedName);
    const id = ingredient.id ?? catalogIngredient?.id ?? null;
    return {
      ...ingredient,
      id,
      normalizedName,
      isPantryStaple:
        catalogIngredient?.isPantryStaple ?? ingredient.isPantryStaple,
    } satisfies RecipeRecommendationIngredient;
  });

  const required = ingredients.filter(
    (ingredient) => !ingredient.optional && !ingredient.isPantryStaple,
  );
  const availableRequired = required.filter(
    (ingredient) =>
      (ingredient.id !== null && availableIds.has(ingredient.id)) ||
      availableNames.has(ingredient.normalizedName),
  );
  const availableIngredients = ingredients
    .filter(
      (ingredient) =>
        (ingredient.id !== null && availableIds.has(ingredient.id)) ||
        availableNames.has(ingredient.normalizedName),
    )
    .map((ingredient) => ingredient.name);
  const missingIngredients = ingredients
    .filter(
      (ingredient) =>
        !ingredient.optional && !availableIngredients.includes(ingredient.name),
    )
    .map((ingredient) => ingredient.name);
  const optionalMissingIngredients = ingredients
    .filter(
      (ingredient) =>
        ingredient.optional && !availableIngredients.includes(ingredient.name),
    )
    .map((ingredient) => ingredient.name);

  return {
    recipe: candidate.recipe,
    matchScore: RecipeMatchScore.create(
      ingredients.length === 0
        ? 0
        : required.length === 0
          ? 1
          : availableRequired.length / required.length,
    ),
    availableIngredients: [...new Set(availableIngredients)],
    missingIngredients: [...new Set(missingIngredients)],
    optionalMissingIngredients: [...new Set(optionalMissingIngredients)],
  };
}

function sortAndDeduplicate(results: RecommendedRecipe[]): RecommendedRecipe[] {
  const ranked = [...results].sort((left, right) => {
    const scoreDifference = right.matchScore.value - left.matchScore.value;
    if (scoreDifference !== 0) return scoreDifference;
    const availabilityDifference =
      right.availableIngredients.length - left.availableIngredients.length;
    if (availabilityDifference !== 0) return availabilityDifference;
    return (
      Number(right.recipe.source === "INTERNAL") -
      Number(left.recipe.source === "INTERNAL")
    );
  });

  const seen = new Set<string>();
  return ranked.filter((result) => {
    const key =
      normalizeRecipeKey(result.recipe.name) ||
      result.recipe.slug.toLowerCase();
    if (seen.has(key)) return false;
    seen.add(key);
    return true;
  });
}

export function createRecipeRecommendationService(
  dependencies: RecipeRecommendationServiceDependencies,
): RecipeRecommendationService {
  const { catalog, ingredients, cuisines, externalProvider } = dependencies;

  return {
    async recommend(request: RecipeRecommendationRequest) {
      const [catalogIngredients, internalCandidates] = await Promise.all([
        ingredients.findMany(),
        catalog.findCandidates({
          mealType: request.mealType,
          cuisineId: request.cuisineId ?? undefined,
          maxPreparationTime: request.maxPreparationTime,
          difficulty: request.difficulty,
        }),
      ]);
      const catalogByName = new Map(
        catalogIngredients.map((ingredient) => [
          normalizeIngredientName(ingredient.normalizedName),
          { id: ingredient.id, isPantryStaple: ingredient.isPantryStaple },
        ]),
      );
      const availableIds = new Set(request.availableIngredientIds);
      const availableNames = new Set(
        catalogIngredients
          .filter((ingredient) => availableIds.has(ingredient.id))
          .map((ingredient) =>
            normalizeIngredientName(ingredient.normalizedName),
          ),
      );
      const internalResults = internalCandidates.map((candidate) =>
        scoreCandidate(candidate, availableIds, availableNames, catalogByName),
      );
      const hasGoodInternalMatch = internalResults.some(
        (result) => result.matchScore.value >= INTERNAL_MATCH_THRESHOLD,
      );

      if (!externalProvider || hasGoodInternalMatch) {
        return sortAndDeduplicate(internalResults);
      }

      try {
        const cuisine = request.cuisineId
          ? await cuisines.findById(request.cuisineId)
          : null;
        const externalCandidates = await externalProvider.searchByIngredients({
          availableIngredients: [...availableNames],
          mealType: request.mealType ?? "ANY",
          cuisine: cuisine?.name,
          cuisineId: request.cuisineId,
          maxPreparationTime: request.maxPreparationTime,
          difficulty: request.difficulty,
        });
        const externalResults = externalCandidates
          .filter(
            (candidate) =>
              (request.difficulty === undefined ||
                candidate.recipe.difficulty === request.difficulty) &&
              (request.maxPreparationTime === undefined ||
                candidate.recipe.preparationTime <= request.maxPreparationTime),
          )
          .map((candidate) =>
            scoreCandidate(
              candidate,
              availableIds,
              availableNames,
              catalogByName,
            ),
          );
        return sortAndDeduplicate([...internalResults, ...externalResults]);
      } catch {
        return sortAndDeduplicate(internalResults);
      }
    },
  };
}
