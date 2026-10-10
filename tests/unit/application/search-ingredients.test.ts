import type { Mock } from "vitest";
import { describe, expect, it, vi } from "vitest";
import { SearchIngredients } from "@/application/ingredients/search-ingredients";
import type { Ingredient } from "@/domain/entities";
import type { IngredientRepository } from "@/domain/ports";

function createFakeIngredients(): IngredientRepository {
  return {
    findById: vi.fn(async () => null),
    findByNormalizedName: vi.fn(async () => null),
    findMany: vi.fn(async () => []),
    findByNormalizedNames: vi.fn(async () => []),
    save: vi.fn(async (ingredient) => ingredient),
  } satisfies IngredientRepository;
}

function makeIngredient(overrides: Partial<Ingredient> = {}): Ingredient {
  return {
    id: "ingredient-tomate",
    name: "Tomate",
    normalizedName: "tomate",
    category: "VEGETABLE",
    isPantryStaple: false,
    createdAt: new Date("2026-01-01T00:00:00Z"),
    updatedAt: new Date("2026-01-01T00:00:00Z"),
    ...overrides,
  };
}

describe("SearchIngredients", () => {
  it("forwards the query to the repository and returns the matches", async () => {
    const ingredients = createFakeIngredients();
    const matches = [makeIngredient()];
    (ingredients.findMany as Mock).mockResolvedValueOnce(matches);
    const useCase = new SearchIngredients(ingredients);

    const result = await useCase.execute({ query: "tom" });

    expect(ingredients.findMany).toHaveBeenCalledTimes(1);
    expect(ingredients.findMany).toHaveBeenCalledWith("tom");
    expect(result).toBe(matches);
  });

  it("lists the full catalog when no query is provided", async () => {
    const ingredients = createFakeIngredients();
    const useCase = new SearchIngredients(ingredients);

    await useCase.execute();

    expect(ingredients.findMany).toHaveBeenCalledWith(undefined);
  });
});
