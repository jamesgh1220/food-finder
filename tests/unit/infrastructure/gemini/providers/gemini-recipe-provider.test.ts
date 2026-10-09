import { describe, expect, it, vi } from "vitest";
import type { Mock } from "vitest";
import type { Logger } from "@/application/ports/logger";
import { GeminiClientError } from "@/infrastructure/gemini/client/gemini-client";
import type { GeminiClient } from "@/infrastructure/gemini/client/gemini-client";
import type { Cuisine } from "@/domain/entities";
import type { Recipe } from "@/domain/entities";
import { RepositoryError } from "@/domain/errors";
import type { CuisineRepository, RecipeRepository } from "@/domain/ports";
import type { ExternalRecipeSearchInput } from "@/application/ports/external-recipe-provider";
import { createGeminiRecipeProvider } from "@/infrastructure/gemini/providers/gemini-recipe-provider";

/**
 * Tests del adaptador GeminiRecipeProvider (spec 09, REQ-02/REQ-08/REQ-10).
 *
 * Se inyecta un cliente falso (`GeminiClient`) y un repositorio de cocinas
 * falso para no tocar red ni base de datos, siguiendo el patrón de los tests
 * de infraestructura existentes.
 */

const NOW = new Date("2026-01-01T00:00:00.000Z");

function makeCuisine(overrides: Partial<Cuisine> = {}): Cuisine {
  return {
    id: "cuisine-it",
    name: "Italiana",
    slug: "italiana",
    country: "IT",
    region: null,
    description: null,
    createdAt: NOW,
    updatedAt: NOW,
    ...overrides,
  };
}

function createFakeCuisineRepository(
  cuisines: Cuisine[] = [makeCuisine()],
): CuisineRepository {
  return {
    findAll: vi.fn(async () => cuisines),
    findById: vi.fn(async () => null),
    findBySlug: vi.fn(async () => null),
  };
}

function createFakeRecipeRepository(
  existingRecipes: Recipe[] = [],
): RecipeRepository {
  return {
    findById: vi.fn(async () => null),
    findBySlug: vi.fn(
      async (slug: string) =>
        existingRecipes.find((recipe) => recipe.slug === slug) ?? null,
    ),
    findByIds: vi.fn(async () => []),
    findMany: vi.fn(async () => []),
    save: vi.fn(async (recipe: Recipe) => ({
      ...recipe,
      id: `persisted-${recipe.slug}`,
      createdAt: NOW,
      updatedAt: NOW,
    })),
  };
}

function createFakeLogger(): Logger {
  return {
    debug: vi.fn(),
    info: vi.fn(),
    warn: vi.fn(),
    error: vi.fn(),
  };
}

function makeInput(
  overrides: Partial<ExternalRecipeSearchInput> = {},
): ExternalRecipeSearchInput {
  return {
    availableIngredients: ["pasta", "tomate"],
    mealType: "DINNER",
    ...overrides,
  };
}

function makeGeminiRecipe(overrides: Record<string, unknown> = {}) {
  return {
    name: "Pasta al tomate",
    description: "Simple",
    cuisine: "Italiana",
    mealType: "DINNER",
    ingredients: [
      { name: "Pasta", quantity: 200, unit: "g" },
      { name: "Tomate", quantity: 2, unit: null },
    ],
    instructions: ["Hervir la pasta.", "Preparar la salsa."],
    preparationTimeMinutes: 20,
    servings: 2,
    difficulty: "EASY",
    ...overrides,
  };
}

function createFakeClient(): {
  client: GeminiClient;
  generateContent: Mock;
} {
  const generateContent = vi.fn();
  const client: GeminiClient = { generateContent };
  return { client, generateContent };
}

describe("createGeminiRecipeProvider", () => {
  it("mapea recetas válidas a entidades de dominio", async () => {
    const { client, generateContent } = createFakeClient();
    generateContent.mockResolvedValue({ recipes: [makeGeminiRecipe()] });
    const recipeRepository = createFakeRecipeRepository();
    const provider = createGeminiRecipeProvider({
      client,
      cuisineRepository: createFakeCuisineRepository(),
      recipeRepository,
      logger: createFakeLogger(),
    });

    const result = await provider.searchByIngredients(
      makeInput({ mealType: "LUNCH" }),
    );

    expect(result).toHaveLength(1);
    const candidate = result[0];
    const recipe = candidate.recipe;
    expect(recipe.source).toBe("AI_GENERATED");
    expect(recipe.slug).toBe("pasta-al-tomate");
    // El mealType respeta el filtro del producto (REQ-11), no el del modelo.
    expect(recipe.mealType).toBe("LUNCH");
    expect(recipe.instructions).toBe("Hervir la pasta.\nPreparar la salsa.");
    expect(recipe.cuisineId).toBe("cuisine-it");
    expect(recipe.sourceUrl).toBeNull();
    expect(recipe.id).toBe("persisted-pasta-al-tomate");
    expect(candidate.ingredients).toEqual([
      expect.objectContaining({
        name: "Pasta",
        normalizedName: "pasta",
        optional: false,
      }),
      expect.objectContaining({
        name: "Tomate",
        normalizedName: "tomate",
        optional: false,
      }),
    ]);
    expect(recipeRepository.findBySlug).toHaveBeenCalledWith("pasta-al-tomate");
    expect(recipeRepository.save).toHaveBeenCalledTimes(1);
    expect(generateContent).toHaveBeenCalledTimes(1);
    const [prompt, responseSchema] = generateContent.mock.calls[0];
    expect(typeof prompt).toBe("string");
    expect(prompt).toContain("pasta");
    expect(responseSchema).toBeDefined();
  });

  it("preserves optional ingredient metadata for recommendation matching", async () => {
    const { client, generateContent } = createFakeClient();
    generateContent.mockResolvedValue({
      recipes: [
        makeGeminiRecipe({
          ingredients: [
            { name: "Pasta", quantity: 200, unit: "g", optional: true },
          ],
        }),
      ],
    });
    const provider = createGeminiRecipeProvider({
      client,
      cuisineRepository: createFakeCuisineRepository(),
      recipeRepository: createFakeRecipeRepository(),
    });

    const result = await provider.searchByIngredients(makeInput());

    expect(result[0]?.ingredients[0]).toMatchObject({
      name: "Pasta",
      optional: true,
    });
  });

  it("devuelve [] sin lanzar cuando el contenido no valida el schema", async () => {
    const { client, generateContent } = createFakeClient();
    generateContent.mockResolvedValue({ recipes: [{ name: "" }] });
    const provider = createGeminiRecipeProvider({
      client,
      cuisineRepository: createFakeCuisineRepository(),
      recipeRepository: createFakeRecipeRepository(),
      logger: createFakeLogger(),
    });

    const result = await provider.searchByIngredients(makeInput());
    expect(result).toEqual([]);
  });

  it("descarta recetas individuales inválidas sin tumbar las válidas", async () => {
    const { client, generateContent } = createFakeClient();
    generateContent.mockResolvedValue({
      recipes: [makeGeminiRecipe(), { name: "" }],
    });
    const provider = createGeminiRecipeProvider({
      client,
      cuisineRepository: createFakeCuisineRepository(),
      recipeRepository: createFakeRecipeRepository(),
      logger: createFakeLogger(),
    });

    const result = await provider.searchByIngredients(makeInput());
    expect(result).toHaveLength(1);
  });

  it("devuelve [] cuando la cocina no se puede resolver", async () => {
    const { client, generateContent } = createFakeClient();
    generateContent.mockResolvedValue({
      recipes: [makeGeminiRecipe({ cuisine: "Marciana" })],
    });
    const provider = createGeminiRecipeProvider({
      client,
      cuisineRepository: createFakeCuisineRepository(),
      recipeRepository: createFakeRecipeRepository(),
      logger: createFakeLogger(),
    });

    const result = await provider.searchByIngredients(
      makeInput({ cuisine: "Mexicana", cuisineId: "cuisine-mx" }),
    );
    expect(result).toEqual([]);
  });

  it("devuelve [] sin tocar la red cuando no hay API key ni cliente", async () => {
    const cuisineRepository = createFakeCuisineRepository();
    const recipeRepository = createFakeRecipeRepository();
    const logger = createFakeLogger();
    const provider = createGeminiRecipeProvider({
      cuisineRepository,
      recipeRepository,
      logger,
    });

    const result = await provider.searchByIngredients(makeInput());

    expect(result).toEqual([]);
    expect(cuisineRepository.findAll).not.toHaveBeenCalled();
    expect(logger.warn).toHaveBeenCalled();
  });

  it("devuelve [] sin lanzar cuando el cliente falla", async () => {
    const { client, generateContent } = createFakeClient();
    generateContent.mockRejectedValue(
      new GeminiClientError("rate_limited", "429"),
    );
    const provider = createGeminiRecipeProvider({
      client,
      cuisineRepository: createFakeCuisineRepository(),
      recipeRepository: createFakeRecipeRepository(),
      logger: createFakeLogger(),
    });

    const result = await provider.searchByIngredients(makeInput());
    expect(result).toEqual([]);
  });

  it("devuelve [] cuando la lista de recetas viene vacía", async () => {
    const { client, generateContent } = createFakeClient();
    generateContent.mockResolvedValue({ recipes: [] });
    const provider = createGeminiRecipeProvider({
      client,
      cuisineRepository: createFakeCuisineRepository(),
      recipeRepository: createFakeRecipeRepository(),
      logger: createFakeLogger(),
    });

    const result = await provider.searchByIngredients(makeInput());
    expect(result).toEqual([]);
  });

  it("devuelve [] y no propaga errores cuando falla la persistencia", async () => {
    const { client, generateContent } = createFakeClient();
    generateContent.mockResolvedValue({ recipes: [makeGeminiRecipe()] });
    const recipeRepository = createFakeRecipeRepository();
    vi.mocked(recipeRepository.save).mockRejectedValue(
      new Error("Database unavailable"),
    );
    const logger = createFakeLogger();
    const provider = createGeminiRecipeProvider({
      client,
      cuisineRepository: createFakeCuisineRepository(),
      recipeRepository,
      logger,
    });

    await expect(provider.searchByIngredients(makeInput())).resolves.toEqual(
      [],
    );
    expect(recipeRepository.save).toHaveBeenCalledTimes(1);
    expect(logger.warn).toHaveBeenCalled();
  });

  it("reutiliza una receta generada persistida y evita volver a guardarla", async () => {
    const { client, generateContent } = createFakeClient();
    generateContent.mockResolvedValue({ recipes: [makeGeminiRecipe()] });
    const existingRecipe = {
      id: "stable-recipe-id",
      name: "Pasta al tomate",
      slug: "pasta-al-tomate",
      description: "Simple",
      cuisineId: "cuisine-it",
      country: null,
      region: null,
      mealType: "DINNER",
      instructions: "Hervir la pasta.\\nPreparar la salsa.",
      preparationTime: 20,
      cookingTime: null,
      servings: 2,
      difficulty: "EASY",
      imageUrl: null,
      source: "AI_GENERATED",
      sourceUrl: null,
      createdAt: NOW,
      updatedAt: NOW,
    } as Recipe;
    const recipeRepository = createFakeRecipeRepository([existingRecipe]);
    const provider = createGeminiRecipeProvider({
      client,
      cuisineRepository: createFakeCuisineRepository(),
      recipeRepository,
      logger: createFakeLogger(),
    });

    const result = await provider.searchByIngredients(makeInput());

    expect(result[0].recipe).toEqual(existingRecipe);
    expect(result[0].recipe.id).toBe("stable-recipe-id");
    expect(recipeRepository.save).not.toHaveBeenCalled();
  });

  it("descarta el resultado si el slug ya pertenece a una receta no generada", async () => {
    const { client, generateContent } = createFakeClient();
    generateContent.mockResolvedValue({ recipes: [makeGeminiRecipe()] });
    const existingRecipe = makePersistedRecipe({ source: "INTERNAL" });
    const recipeRepository = createFakeRecipeRepository([existingRecipe]);
    const provider = createGeminiRecipeProvider({
      client,
      cuisineRepository: createFakeCuisineRepository(),
      recipeRepository,
      logger: createFakeLogger(),
    });

    const result = await provider.searchByIngredients(makeInput());

    expect(result).toEqual([]);
    expect(recipeRepository.save).not.toHaveBeenCalled();
  });

  it("reuses an AI-generated recipe when insert loses a unique-slug race", async () => {
    const { client, generateContent } = createFakeClient();
    generateContent.mockResolvedValue({ recipes: [makeGeminiRecipe()] });
    const existingRecipe = makePersistedRecipe({
      id: "raced-recipe-id",
      source: "AI_GENERATED",
    });
    const recipeRepository = createFakeRecipeRepository();
    vi.mocked(recipeRepository.findBySlug)
      .mockResolvedValueOnce(null)
      .mockResolvedValueOnce(existingRecipe);
    vi.mocked(recipeRepository.save).mockRejectedValue(
      new RepositoryError("Unique constraint", { code: "23505" }),
    );
    const provider = createGeminiRecipeProvider({
      client,
      cuisineRepository: createFakeCuisineRepository(),
      recipeRepository,
      logger: createFakeLogger(),
    });

    const result = await provider.searchByIngredients(makeInput());

    expect(result[0].recipe).toEqual(existingRecipe);
    expect(result[0].recipe.id).toBe("raced-recipe-id");
    expect(recipeRepository.findBySlug).toHaveBeenCalledTimes(2);
  });

  it("preserves successful saves and continues after an individual save fails", async () => {
    const { client, generateContent } = createFakeClient();
    generateContent.mockResolvedValue({
      recipes: [
        makeGeminiRecipe(),
        makeGeminiRecipe({ name: "Pasta con verduras" }),
        makeGeminiRecipe({ name: "Pasta al pesto" }),
      ],
    });
    const recipeRepository = createFakeRecipeRepository();
    vi.mocked(recipeRepository.save).mockImplementation(async (recipe) => {
      if (recipe.slug === "pasta-con-verduras") {
        throw new Error("Database unavailable");
      }
      return { ...recipe, id: `persisted-${recipe.slug}` };
    });
    const provider = createGeminiRecipeProvider({
      client,
      cuisineRepository: createFakeCuisineRepository(),
      recipeRepository,
      logger: createFakeLogger(),
    });

    const result = await provider.searchByIngredients(makeInput());

    expect(result.map((recipe) => recipe.recipe.slug)).toEqual([
      "pasta-al-tomate",
      "pasta-al-pesto",
    ]);
    expect(recipeRepository.save).toHaveBeenCalledTimes(3);
  });
});

function makePersistedRecipe(overrides: Partial<Recipe> = {}): Recipe {
  return {
    id: "existing-recipe-id",
    name: "Pasta al tomate",
    slug: "pasta-al-tomate",
    description: "Simple",
    cuisineId: "cuisine-it",
    country: null,
    region: null,
    mealType: "DINNER",
    instructions: "Hervir la pasta.\\nPreparar la salsa.",
    preparationTime: 20,
    cookingTime: null,
    servings: 2,
    difficulty: "EASY",
    imageUrl: null,
    source: "AI_GENERATED",
    sourceUrl: null,
    createdAt: NOW,
    updatedAt: NOW,
    ...overrides,
  };
}
