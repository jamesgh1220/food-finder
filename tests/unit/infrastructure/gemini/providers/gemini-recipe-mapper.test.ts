import { describe, expect, it } from "vitest";
import type { ExternalRecipeSearchInput } from "@/application/ports/external-recipe-provider";
import type { Cuisine } from "@/domain/entities";
import type { GeminiRecipe } from "@/infrastructure/gemini/schemas";
import {
  mapGeminiRecipeToDomain,
  resolveCuisineId,
  slugify,
} from "@/infrastructure/gemini/providers/gemini-recipe-mapper";

const NOW = new Date("2026-01-01T00:00:00.000Z");

function makeCuisine(overrides: Partial<Cuisine> = {}): Cuisine {
  return {
    id: "cuisine-es",
    name: "Española",
    slug: "espanola",
    country: "ES",
    region: null,
    description: null,
    createdAt: NOW,
    updatedAt: NOW,
    ...overrides,
  };
}

function makeInput(
  overrides: Partial<ExternalRecipeSearchInput> = {},
): ExternalRecipeSearchInput {
  return {
    availableIngredients: ["patata", "huevo"],
    mealType: "DINNER",
    ...overrides,
  };
}

function makeGeminiRecipe(overrides: Partial<GeminiRecipe> = {}): GeminiRecipe {
  return {
    name: "Tortilla de patatas",
    description: "Clásica",
    cuisine: "Española",
    mealType: "DINNER",
    ingredients: [{ name: "Patata", quantity: 4, unit: "unidad" }],
    instructions: ["Pelar las patatas.", "Freír y cuajar."],
    preparationTimeMinutes: 30,
    servings: 4,
    difficulty: "EASY",
    ...overrides,
  };
}

describe("slugify", () => {
  it("normaliza acentos, espacios y signos", () => {
    expect(slugify("Tortilla de patatas")).toBe("tortilla-de-patatas");
    expect(slugify("Café con leche")).toBe("cafe-con-leche");
    expect(slugify("  ¡Arroz!  con  leche ")).toBe("arroz-con-leche");
  });
});

describe("resolveCuisineId", () => {
  it("resuelve contra el catálogo por nombre (sin acentos ni mayúsculas)", () => {
    const id = resolveCuisineId(
      makeGeminiRecipe({ cuisine: "espanola" }),
      makeInput(),
      [makeCuisine()],
    );
    expect(id).toBe("cuisine-es");
  });

  it("cae al cuisineId del input cuando no se pidió cocina", () => {
    const id = resolveCuisineId(
      makeGeminiRecipe({ cuisine: "Marciana" }),
      makeInput({ cuisineId: "cuisine-x" }),
      [makeCuisine()],
    );
    expect(id).toBe("cuisine-x");
  });

  it("cae al cuisineId del input cuando la cocina pedida coincide", () => {
    const cuisines = [makeCuisine({ id: "cuisine-mx", name: "Mexicana" })];
    const id = resolveCuisineId(
      makeGeminiRecipe({ cuisine: "Mexicana" }),
      makeInput({ cuisine: "Mexicana", cuisineId: "cuisine-mx" }),
      cuisines,
    );
    expect(id).toBe("cuisine-mx");
  });

  it("devuelve null cuando no puede resolver la cocina", () => {
    const id = resolveCuisineId(
      makeGeminiRecipe({ cuisine: "Marciana" }),
      makeInput({ cuisine: "Mexicana", cuisineId: "cuisine-mx" }),
      [makeCuisine()],
    );
    expect(id).toBeNull();
  });
});

describe("mapGeminiRecipeToDomain", () => {
  it("mapea a una entidad de dominio con source AI_GENERATED", () => {
    const recipe = mapGeminiRecipeToDomain({
      recipe: makeGeminiRecipe(),
      input: makeInput(),
      cuisineId: "cuisine-es",
    });

    expect(recipe.id).toMatch(
      /^[0-9a-f]{8}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{12}$/,
    );
    expect(recipe.slug).toBe("tortilla-de-patatas");
    expect(recipe.source).toBe("AI_GENERATED");
    expect(recipe.sourceUrl).toBeNull();
    expect(recipe.mealType).toBe("DINNER");
    expect(recipe.instructions).toBe("Pelar las patatas.\nFreír y cuajar.");
    expect(recipe.preparationTime).toBe(30);
    expect(recipe.cookingTime).toBeNull();
    expect(recipe.imageUrl).toBeNull();
    expect(recipe.country).toBeNull();
    expect(recipe.region).toBeNull();
    expect(recipe.difficulty).toBe("EASY");
  });

  it("usa ANY/null cuando la receta no trae dificultad", () => {
    const recipe = mapGeminiRecipeToDomain({
      recipe: makeGeminiRecipe({ difficulty: null }),
      input: makeInput(),
      cuisineId: "cuisine-es",
    });
    expect(recipe.difficulty).toBeNull();
  });
});
