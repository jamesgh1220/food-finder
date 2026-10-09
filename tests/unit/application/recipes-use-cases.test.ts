import type { Mock } from "vitest";
import { describe, expect, it, vi } from "vitest";
import { FindRecipesFromPantry } from "@/application/recipes/find-recipes-from-pantry";
import { GetRecipeById } from "@/application/recipes/get-recipe-by-id";
import { SearchRecipes } from "@/application/recipes/search-recipes";
import { GetRecipesByMealType } from "@/application/recipes/get-recipes-by-meal-type";
import type { RecommendedRecipe } from "@/application/ports/recipe-recommendation";
import { NotFoundError, UnauthorizedError } from "@/domain/errors";
import type { RecipeRepository } from "@/domain/ports";
import { RecipeMatchScore } from "@/domain/value-objects";
import { createFakeAuthPort, makeRecipe } from "./helpers";

function createFakeRecommendations(results: RecommendedRecipe[] = []) {
  return {
    recommend: vi.fn(async () => results),
  };
}

function createFakeRecipes(): RecipeRepository {
  return {
    findById: vi.fn(async () => null),
    findBySlug: vi.fn(async () => null),
    findByIds: vi.fn(async () => []),
    findMany: vi.fn(async () => []),
    save: vi.fn(async (recipe) => recipe),
  } satisfies RecipeRepository;
}

function makeRecommendation(cuisineId: string, id: string): RecommendedRecipe {
  return {
    recipe: makeRecipe({ id, cuisineId }),
    matchScore: RecipeMatchScore.create(0.9),
    availableIngredients: ["ing-1"],
    missingIngredients: [],
    optionalMissingIngredients: [],
  };
}

describe("FindRecipesFromPantry", () => {
  it("without cuisine forwards undefined and returns multi-cuisine results", async () => {
    const results = [
      makeRecommendation("cuisine-es", "recipe-1"),
      makeRecommendation("cuisine-it", "recipe-2"),
    ];
    const recommendations = createFakeRecommendations(results);
    const useCase = new FindRecipesFromPantry(
      recommendations,
      createFakeAuthPort(),
    );

    const output = await useCase.execute({
      ingredientIds: ["ing-1", "ing-2"],
    });

    expect(recommendations.recommend).toHaveBeenCalledWith({
      availableIngredientIds: ["ing-1", "ing-2"],
      mealType: undefined,
      cuisineId: undefined,
      maxPreparationTime: undefined,
      difficulty: undefined,
      preferences: undefined,
    });
    expect(output).toHaveLength(2);
    const cuisines = output.map((item) => item.recipe.cuisineId);
    expect(new Set(cuisines).size).toBe(2);
  });

  it("forwards an explicit cuisine filter when provided", async () => {
    const recommendations = createFakeRecommendations([]);
    const useCase = new FindRecipesFromPantry(
      recommendations,
      createFakeAuthPort(),
    );

    await useCase.execute({
      ingredientIds: ["ing-1"],
      cuisineId: "cuisine-it",
    });

    expect(recommendations.recommend).toHaveBeenCalledWith({
      availableIngredientIds: ["ing-1"],
      mealType: undefined,
      cuisineId: "cuisine-it",
      maxPreparationTime: undefined,
      difficulty: undefined,
      preferences: undefined,
    });
  });

  it("forwards preparation, difficulty, and preference filters", async () => {
    const recommendations = createFakeRecommendations([]);
    const useCase = new FindRecipesFromPantry(
      recommendations,
      createFakeAuthPort(),
    );

    await useCase.execute({
      ingredientIds: ["ing-1"],
      maxPreparationTime: 30,
      difficulty: "EASY",
      preferences: { preferredCuisines: ["cuisine-it"] },
    });

    expect(recommendations.recommend).toHaveBeenCalledWith({
      availableIngredientIds: ["ing-1"],
      mealType: undefined,
      cuisineId: undefined,
      maxPreparationTime: 30,
      difficulty: "EASY",
      preferences: { preferredCuisines: ["cuisine-it"] },
    });
  });

  it("throws UnauthorizedError without a session", async () => {
    const recommendations = createFakeRecommendations([]);
    const useCase = new FindRecipesFromPantry(
      recommendations,
      createFakeAuthPort(null),
    );

    await expect(
      useCase.execute({ ingredientIds: ["ing-1"] }),
    ).rejects.toBeInstanceOf(UnauthorizedError);
    expect(recommendations.recommend).not.toHaveBeenCalled();
  });
});

describe("GetRecipeById", () => {
  it("returns the recipe when it exists", async () => {
    const recipes = createFakeRecipes();
    const recipe = makeRecipe({ id: "recipe-9" });
    (recipes.findById as Mock).mockResolvedValueOnce(recipe);
    const useCase = new GetRecipeById(recipes);

    await expect(useCase.execute({ id: "recipe-9" })).resolves.toBe(recipe);
    expect(recipes.findById).toHaveBeenCalledWith("recipe-9");
  });

  it("throws NotFoundError when it does not exist", async () => {
    const recipes = createFakeRecipes();
    const useCase = new GetRecipeById(recipes);

    await expect(useCase.execute({ id: "missing" })).rejects.toBeInstanceOf(
      NotFoundError,
    );
  });
});

describe("SearchRecipes", () => {
  it("delegates the filter to the repository", async () => {
    const recipes = createFakeRecipes();
    (recipes.findMany as Mock).mockResolvedValueOnce([makeRecipe()]);
    const useCase = new SearchRecipes(recipes);

    const result = await useCase.execute({
      search: "tortilla",
      mealType: "LUNCH",
      cuisineId: "cuisine-es",
    });

    expect(recipes.findMany).toHaveBeenCalledWith({
      search: "tortilla",
      mealType: "LUNCH",
      cuisineId: "cuisine-es",
    });
    expect(result).toHaveLength(1);
  });

  it("defaults to an empty filter with no input", async () => {
    const recipes = createFakeRecipes();
    const useCase = new SearchRecipes(recipes);

    await useCase.execute();

    expect(recipes.findMany).toHaveBeenCalledWith({
      search: undefined,
      mealType: undefined,
      cuisineId: undefined,
    });
  });
});

describe("GetRecipesByMealType", () => {
  it("delegates the meal type filter to the repository", async () => {
    const recipes = createFakeRecipes();
    const useCase = new GetRecipesByMealType(recipes);

    await useCase.execute({ mealType: "DINNER" });

    expect(recipes.findMany).toHaveBeenCalledWith({ mealType: "DINNER" });
  });
});
