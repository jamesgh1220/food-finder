import { describe, expect, it, vi } from "vitest";
import { createRecipeRecommendationService } from "@/application/recipes/create-recipe-recommendation-service";
import type { RecipeRecommendationCandidate } from "@/domain/entities";
import type { IngredientRepository, CuisineRepository } from "@/domain/ports";
import type { RecipeRecommendationCatalog } from "@/application/ports/recipe-recommendation";
import type { ExternalRecipeProvider } from "@/application/ports/external-recipe-provider";
import { makeRecipe } from "./helpers";

const NOW = new Date("2026-01-01T00:00:00.000Z");

function ingredient(
  id: string,
  name: string,
  options: Partial<RecipeRecommendationCandidate["ingredients"][number]> = {},
) {
  return {
    id,
    name,
    normalizedName: name.toLowerCase(),
    isPantryStaple: false,
    optional: false,
    ...options,
  };
}

function candidate(
  id: string,
  items: RecipeRecommendationCandidate["ingredients"],
  source: "INTERNAL" | "AI_GENERATED" = "INTERNAL",
  name = `Recipe ${id}`,
): RecipeRecommendationCandidate {
  return {
    recipe: makeRecipe({
      id,
      name,
      slug: name.toLowerCase().replaceAll(" ", "-"),
      source,
    }),
    ingredients: items,
  };
}

function setup(
  internal: RecipeRecommendationCandidate[],
  external?: RecipeRecommendationCandidate[],
  providerError?: Error,
) {
  const catalog: RecipeRecommendationCatalog = {
    findCandidates: vi.fn(async () => internal),
  };
  const catalogIngredients = [
    { id: "salt", name: "Salt", normalizedName: "salt", isPantryStaple: true },
    {
      id: "a",
      name: "Ingredient A",
      normalizedName: "ingredient a",
      isPantryStaple: false,
    },
    {
      id: "b",
      name: "Ingredient B",
      normalizedName: "ingredient b",
      isPantryStaple: false,
    },
    {
      id: "c",
      name: "Ingredient C",
      normalizedName: "ingredient c",
      isPantryStaple: false,
    },
    {
      id: "d",
      name: "Ingredient D",
      normalizedName: "ingredient d",
      isPantryStaple: false,
    },
    {
      id: "e",
      name: "Ingredient E",
      normalizedName: "ingredient e",
      isPantryStaple: false,
    },
  ].map((value) => ({
    ...value,
    category: null,
    createdAt: NOW,
    updatedAt: NOW,
  }));
  const ingredients = {
    findMany: vi.fn(async () => catalogIngredients),
  } as unknown as IngredientRepository;
  const cuisines = {
    findAll: vi.fn(async () => []),
    findById: vi.fn(async () => null),
    findBySlug: vi.fn(async () => null),
  } satisfies CuisineRepository;
  const externalProvider = external
    ? ({
        searchByIngredients: vi.fn(async () => {
          if (providerError) throw providerError;
          return external;
        }),
      } satisfies ExternalRecipeProvider)
    : undefined;
  return {
    service: createRecipeRecommendationService({
      catalog,
      ingredients,
      cuisines,
      externalProvider,
    }),
    catalog,
    externalProvider,
  };
}

describe("createRecipeRecommendationService", () => {
  it("scores four of five required ingredients as 0.8", async () => {
    const recipe = candidate("four-of-five", [
      ingredient("a", "Ingredient A"),
      ingredient("b", "Ingredient B"),
      ingredient("c", "Ingredient C"),
      ingredient("d", "Ingredient D"),
      ingredient("e", "Ingredient E"),
    ]);
    const { service } = setup([recipe]);

    const result = await service.recommend({
      availableIngredientIds: ["a", "b", "c", "d"],
    });

    expect(result[0]?.matchScore.value).toBe(0.8);
    expect(result[0]?.availableIngredients).toHaveLength(4);
    expect(result[0]?.missingIngredients).toEqual(["Ingredient E"]);
  });

  it("does not reduce the required score for a missing catalog staple", async () => {
    const recipe = candidate("staple", [
      ingredient("a", "Ingredient A"),
      ingredient("salt", "Salt", { isPantryStaple: true }),
    ]);
    const { service } = setup([recipe]);

    const result = await service.recommend({ availableIngredientIds: ["a"] });

    expect(result[0]?.matchScore.value).toBe(1);
    expect(result[0]?.missingIngredients).toEqual(["Salt"]);
  });

  it("allows multiple cuisines when no cuisine filter is provided", async () => {
    const peruvian = candidate("peru", [ingredient("a", "Ingredient A")]);
    peruvian.recipe.cuisineId = "cuisine-pe";
    const italian = candidate("italy", [ingredient("b", "Ingredient B")]);
    italian.recipe.cuisineId = "cuisine-it";
    const { service, catalog } = setup([peruvian, italian]);

    const result = await service.recommend({
      availableIngredientIds: ["a", "b"],
    });

    expect(result.map((item) => item.recipe.cuisineId)).toEqual([
      "cuisine-pe",
      "cuisine-it",
    ]);
    expect(catalog.findCandidates).toHaveBeenCalledWith(
      expect.objectContaining({ cuisineId: undefined }),
    );
  });

  it("filters internal candidates by an explicit cuisine", async () => {
    const peruvian = candidate("peru", [ingredient("a", "Ingredient A")]);
    peruvian.recipe.cuisineId = "cuisine-pe";
    const { service, catalog } = setup([peruvian]);

    await service.recommend({
      availableIngredientIds: ["a"],
      cuisineId: "cuisine-pe",
    });

    expect(catalog.findCandidates).toHaveBeenCalledWith(
      expect.objectContaining({ cuisineId: "cuisine-pe" }),
    );
  });

  it("treats candidates with no recipe ingredients as a zero match", async () => {
    const recipe = candidate("empty", []);
    const { service } = setup([recipe]);

    const result = await service.recommend({ availableIngredientIds: [] });

    expect(result[0]?.matchScore.value).toBe(0);
  });

  it("reports optional missing ingredients separately", async () => {
    const recipe = candidate("optional", [
      ingredient("a", "Ingredient A"),
      ingredient("b", "Ingredient B", { optional: true }),
    ]);
    const { service } = setup([recipe]);

    const result = await service.recommend({ availableIngredientIds: ["a"] });

    expect(result[0]?.matchScore.value).toBe(1);
    expect(result[0]?.missingIngredients).toEqual([]);
    expect(result[0]?.optionalMissingIngredients).toEqual(["Ingredient B"]);
  });

  it("falls back to external candidates when no good internal match exists", async () => {
    const internal = candidate("weak", [
      ingredient("a", "Ingredient A"),
      ingredient("b", "Ingredient B"),
      ingredient("c", "Ingredient C"),
      ingredient("d", "Ingredient D"),
      ingredient("e", "Ingredient E"),
    ]);
    const external = candidate(
      "strong",
      [ingredient("a", "Ingredient A"), ingredient("b", "Ingredient B")],
      "AI_GENERATED",
    );
    const { service, externalProvider } = setup([internal], [external]);

    const result = await service.recommend({
      availableIngredientIds: ["a", "b"],
    });

    expect(externalProvider?.searchByIngredients).toHaveBeenCalledOnce();
    expect(result.map((item) => item.recipe.id)).toEqual(["strong", "weak"]);
  });

  it("skips external generation when an internal recipe reaches the good-match threshold", async () => {
    const internal = candidate("good", [
      ingredient("a", "Ingredient A"),
      ingredient("b", "Ingredient B"),
      ingredient("c", "Ingredient C"),
      ingredient("d", "Ingredient D"),
      ingredient("e", "Ingredient E"),
    ]);
    const external = candidate(
      "unused",
      [ingredient("a", "Ingredient A")],
      "AI_GENERATED",
    );
    const { service, externalProvider } = setup([internal], [external]);

    await service.recommend({
      availableIngredientIds: ["a", "b", "c", "d"],
    });

    expect(externalProvider?.searchByIngredients).not.toHaveBeenCalled();
  });

  it("keeps internal results when the external provider fails", async () => {
    const internal = candidate("weak", [
      ingredient("a", "Ingredient A"),
      ingredient("b", "Ingredient B"),
      ingredient("c", "Ingredient C"),
      ingredient("d", "Ingredient D"),
      ingredient("e", "Ingredient E"),
    ]);
    const external = candidate(
      "unused",
      [ingredient("a", "Ingredient A")],
      "AI_GENERATED",
    );
    const { service } = setup(
      [internal],
      [external],
      new Error("provider failed"),
    );

    const result = await service.recommend({ availableIngredientIds: ["a"] });

    expect(result.map((item) => item.recipe.id)).toEqual(["weak"]);
  });

  it("deduplicates normalized recipe names and lets a better external match win", async () => {
    const internal = candidate(
      "weak",
      [
        ingredient("a", "Ingredient A"),
        ingredient("b", "Ingredient B"),
        ingredient("c", "Ingredient C"),
        ingredient("d", "Ingredient D"),
        ingredient("e", "Ingredient E"),
      ],
      "INTERNAL",
      "Café de Arroz",
    );
    const external = candidate(
      "strong",
      [ingredient("a", "Ingredient A"), ingredient("b", "Ingredient B")],
      "AI_GENERATED",
      "Cafe de arroz!",
    );
    const { service } = setup([internal], [external]);

    const result = await service.recommend({
      availableIngredientIds: ["a", "b"],
    });

    expect(result).toHaveLength(1);
    expect(result[0]?.recipe.id).toBe("strong");
    expect(result[0]?.matchScore.value).toBe(1);
  });

  it("passes optional cuisine and preparation filters to the internal catalog", async () => {
    const { service, catalog } = setup([]);

    await service.recommend({
      availableIngredientIds: [],
      mealType: "DINNER",
      maxPreparationTime: 30,
      difficulty: "EASY",
    });

    expect(catalog.findCandidates).toHaveBeenCalledWith({
      mealType: "DINNER",
      cuisineId: undefined,
      maxPreparationTime: 30,
      difficulty: "EASY",
    });
  });

  it("applies difficulty and preparation-time filters to external candidates", async () => {
    const internal = candidate("weak", [
      ingredient("a", "Ingredient A"),
      ingredient("b", "Ingredient B"),
      ingredient("c", "Ingredient C"),
      ingredient("d", "Ingredient D"),
      ingredient("e", "Ingredient E"),
    ]);
    const external = candidate(
      "too-hard",
      [ingredient("a", "Ingredient A")],
      "AI_GENERATED",
    );
    external.recipe.difficulty = "HARD";
    external.recipe.preparationTime = 50;
    const { service, externalProvider } = setup([internal], [external]);

    const result = await service.recommend({
      availableIngredientIds: ["a"],
      difficulty: "EASY",
      maxPreparationTime: 30,
    });

    expect(externalProvider?.searchByIngredients).toHaveBeenCalledWith(
      expect.objectContaining({ difficulty: "EASY", maxPreparationTime: 30 }),
    );
    expect(result.map((item) => item.recipe.id)).toEqual(["weak"]);
  });
});
