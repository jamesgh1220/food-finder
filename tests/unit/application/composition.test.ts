import { describe, expect, it, vi } from "vitest";
import { createApplicationServices, type ApplicationServices } from "@/lib/composition/application";
import type { AuthPort } from "@/application/ports/auth";
import type { RecipeRecommendationService } from "@/application/ports/recipe-recommendation";
import type {
  CuisineRepository,
  FavoriteRepository,
  IngredientRepository,
  PantryRepository,
  RecipeRepository,
} from "@/domain/ports";
import { createFakeAuthPort } from "./helpers";

/**
 * Composition root de aplicación (spec 07): cablea los 18 casos de uso
 * (4 de auth reutilizando `createAuthServices` + 14 nuevos) a partir de
 * puertos inyectados. Los tests solo verifican el cableado, no el
 * comportamiento (eso lo cubren los tests por caso de uso).
 */
function createMockDependencies() {
  const fakePantry: PantryRepository = {
    listByUser: vi.fn(async () => []),
    findByUserAndIngredient: vi.fn(async () => null),
    upsert: vi.fn(async (item) => item),
    remove: vi.fn(async () => {}),
    clearByUser: vi.fn(async () => {}),
  };
  const fakeRecipes: RecipeRepository = {
    findById: vi.fn(async () => null),
    findBySlug: vi.fn(async () => null),
    findByIds: vi.fn(async () => []),
    findMany: vi.fn(async () => []),
    save: vi.fn(async (recipe) => recipe),
  };
  const fakeCuisines: CuisineRepository = {
    findAll: vi.fn(async () => []),
    findById: vi.fn(async () => null),
    findBySlug: vi.fn(async () => null),
  };
  const fakeFavorites: FavoriteRepository = {
    listByUser: vi.fn(async () => []),
    exists: vi.fn(async () => false),
    add: vi.fn(async (favorite) => favorite),
    remove: vi.fn(async () => {}),
  };
  const fakeRecommendations: RecipeRecommendationService = {
    recommend: vi.fn(async () => []),
  };
    const fakeIngredients: IngredientRepository = {
    findById: vi.fn(async () => null),
    findByNormalizedName: vi.fn(async () => null),
    findMany: vi.fn(async () => []),
    findByNormalizedNames: vi.fn(async () => []),
    save: vi.fn(async (ingredient) => ingredient),
  };  return {
    auth: createFakeAuthPort() as AuthPort,
    pantry: fakePantry,
    recipes: fakeRecipes,
    cuisines: fakeCuisines,
    favorites: fakeFavorites,
    recommendations: fakeRecommendations,
    ingredients: fakeIngredients,
  };
}

const EXPECTED_SERVICE_KEYS = [
  "registerUser",
  "loginUser",
  "logoutUser",
  "getCurrentUser",
  "addPantryIngredient",
  "updatePantryIngredient",
  "removePantryIngredient",
  "getUserPantry",
  "clearUserPantry",
  "findRecipesFromPantry",
  "getRecipeById",
  "searchRecipes",
  "getRecipesByMealType",
  "getCuisines",
  "getCuisineById",
  "addFavoriteRecipe",
  "removeFavoriteRecipe",
  "getFavoriteRecipes",
  "searchIngredients",
] as const satisfies ReadonlyArray<keyof ApplicationServices>;

describe("createApplicationServices", () => {
  it("wires all 18 use cases (4 auth + 14 new) with an execute function", () => {
    const services = createApplicationServices(createMockDependencies());

    expect(Object.keys(services).sort()).toEqual(
      [...EXPECTED_SERVICE_KEYS].sort(),
    );
    for (const key of EXPECTED_SERVICE_KEYS) {
      expect(services[key], `falta ${key}`).toBeDefined();
      expect(typeof services[key].execute).toBe("function");
    }
  });

  it("reuses the auth wiring from createAuthServices", () => {
    const deps = createMockDependencies();
    const services = createApplicationServices(deps);

    expect(services.loginUser.execute).toBeDefined();
    expect(services.getCurrentUser.execute).toBeDefined();
  });
});