import type {
  ExternalRecipeProvider,
  ExternalRecipeSearchInput,
} from "@/application/ports/external-recipe-provider";
import type {
  ExternalRecipePromptInput,
  ExternalRecipePromptProvider,
  GeneratedRecipe,
} from "@/application/ports/external-recipe-prompt-provider";
import type { Logger } from "@/application/ports/logger";
import type { Recipe, RecipeRecommendationCandidate } from "@/domain/entities";
import { normalizeIngredientName } from "@/domain/normalization/ingredient-normalizer";
import { RepositoryError } from "@/domain/errors";
import type { CuisineRepository, RecipeRepository } from "@/domain/ports";
import {
  createGeminiClient,
  GeminiClientError,
  type GeminiClient,
} from "../client/gemini-client";
import {
  GeminiRecipeSchema,
  GeminiRecipesResponseSchema,
  geminiResponseSchema,
  geminiResponseSchemaWithCuisines,
  type GeminiRecipe,
} from "../schemas";
import {
  mapGeminiRecipeToDomain,
  resolveCuisineId,
} from "./gemini-recipe-mapper";

/**
 * Adapter `GeminiRecipeProvider` (spec 09, REQ-02/REQ-08/REQ-09).
 *
 * Implementa dos puertos: `ExternalRecipeProvider` (búsqueda por ingredientes,
 * consumida por el motor de recomendación) y `ExternalRecipePromptProvider`
 * (una receta desde una petición libre, consumida por el dashboard). Ambos
 * comparten el pipeline `prompt → cliente Gemini → schema Zod → mapper →
 * dominio`. Es el único punto que conoce Gemini; fuera de
 * `src/infrastructure/gemini/` no escapa ningún campo crudo del modelo.
 *
 * Degradación elegante (REQ-08): sin API key o ante cualquier fallo, la
 * búsqueda devuelve una lista vacía y la generación por petición devuelve
 * `null`, registrando el problema. NUNCA lanza y NUNCA expone el error técnico,
 * para que el proveedor externo no sea un punto único de fallo.
 */

/** Opciones de construcción del proveedor. */
export interface GeminiRecipeProviderOptions {
  apiKey?: string;
  model?: string;
  baseUrl?: string;
  timeoutMs?: number;
  maxRetries?: number;
  /** Logger inyectable; si falta, el proveedor opera en silencio. */
  logger?: Logger;
  /** Cliente inyectable para tests (permite reemplazar el HTTP real). */
  client?: GeminiClient;
  /** Catálogo de cocinas para resolver la cocina generada (REQ-09). */
  cuisineRepository: CuisineRepository;
  /** Persistencia interna de recetas para asignar IDs estables (REQ-07). */
  recipeRepository: RecipeRepository;
}

/** Construye el prompt en español con los filtros y reglas de seguridad. */
function buildPrompt(input: ExternalRecipeSearchInput): string {
  const lines = [
    "Eres un asistente culinario. Genera recetas en español a partir de los ingredientes disponibles.",
    "",
    `Ingredientes disponibles: ${input.availableIngredients.join(", ")}.`,
    `El tipo de comida es ${input.mealType}.`,
  ];

  if (input.cuisine) {
    lines.push(`La cocina preferida es ${input.cuisine}.`);
  }
  if (input.maxPreparationTime) {
    lines.push(
      `El tiempo máximo de preparación es ${input.maxPreparationTime} minutos.`,
    );
  }
  if (input.difficulty) {
    lines.push(`La dificultad requerida es ${input.difficulty}.`);
  }

  lines.push(
    "",
    "Reglas:",
    "1. Escribe en español el nombre, la cocina, los ingredientes y los pasos.",
    "2. Usa principalmente los ingredientes disponibles; puedes asumir básicos de despensa (sal, aceite, agua, pimienta).",
    "3. Nunca uses preparaciones inseguras: cocina carnes, aves, huevos y pescados por completo.",
    "4. Devuelve pasos claros y ordenados en el arreglo de instrucciones.",
    "5. Las cantidades deben ser números positivos o null; la unidad puede ser null.",
    '6. Responde ÚNICAMENTE con un objeto JSON válido con la forma { "recipes": [ ... ] }, sin texto adicional.',
    "7. Si los ingredientes alcanzan solo para una receta, devuelve solo una; si no alcanzan, devuelve las que puedas usando sustituciones con básicos de despensa.",
  );

  return lines.join("\n");
}

/**
 * Construye el prompt de "chef" para una petición libre del usuario.
 *
 * A diferencia de `buildPrompt`, aquí el usuario manda: no hay filtros
 * estructurados, sino su propia descripción. La cocina se restringe al catálogo
 * real para que la receta siempre tenga un `cuisineId` resoluble.
 */
function buildChefPrompt(
  input: ExternalRecipePromptInput,
  cuisineNames: string[],
): string {
  const lines = [
    "Eres un chef profesional. El usuario te cuenta qué ingredientes tiene y qué quiere cocinar.",
    "Genera UNA receta completa, clara y lista para cocinar, en español.",
    "",
    "Petición del usuario:",
    input.prompt,
    "",
    "Reglas:",
    "1. Usa principalmente los ingredientes que menciona el usuario; puedes asumir básicos de despensa (sal, aceite, agua, pimienta).",
    "2. Escribe el nombre, la cocina, los ingredientes y los pasos en español.",
    "3. Asigna cantidades concretas a cada ingrediente (número positivo + unidad); usa null solo cuando no aplique.",
    "4. Devuelve pasos ordenados y detallados, con tiempos cuando correspondan.",
    "5. Nunca uses preparaciones inseguras: cocina carnes, aves, huevos y pescados por completo.",
    "6. Devuelve EXACTAMENTE una receta dentro del arreglo.",
  ];

  if (cuisineNames.length > 0) {
    lines.push(
      `7. Elige la cocina ÚNICAMENTE entre estas opciones: ${cuisineNames.join(", ")}.`,
    );
  }

  lines.push(
    '8. Responde ÚNICAMENTE con un objeto JSON válido con la forma { "recipes": [ ... ] }, sin texto adicional.',
  );

  return lines.join("\n");
}

/**
 * Valida el sobre y cada receta por separado.
 *
 * Una receta inválida se descarta sin tumbar el lote (REQ-10); un sobre
 * inválido descarta la respuesta completa.
 */
function parseRecipes(raw: unknown, logger?: Logger): GeminiRecipe[] {
  const envelope = GeminiRecipesResponseSchema.safeParse(raw);
  if (!envelope.success) {
    logger?.warn(
      "La respuesta de Gemini no tiene la forma esperada; se descarta.",
      { issues: envelope.error.issues.length },
    );
    return [];
  }

  const recipes: GeminiRecipe[] = [];
  let discarded = 0;
  for (const item of envelope.data.recipes) {
    const parsed = GeminiRecipeSchema.safeParse(item);
    if (!parsed.success) {
      discarded += 1;
      continue;
    }
    recipes.push(parsed.data);
  }
  if (discarded > 0) {
    logger?.warn(
      "Algunas recetas de Gemini se descartaron por no validar el schema.",
      { discarded },
    );
  }

  return recipes;
}

/** Mapea y deduplica por slug las recetas válidas. */
function mapRecipes(
  recipes: GeminiRecipe[],
  input: ExternalRecipeSearchInput,
  cuisines: Awaited<ReturnType<CuisineRepository["findAll"]>>,
  logger?: Logger,
): RecipeRecommendationCandidate[] {
  const mapped: RecipeRecommendationCandidate[] = [];
  const seenSlugs = new Set<string>();

  for (const recipe of recipes) {
    const cuisineId = resolveCuisineId(recipe, input, cuisines);
    if (!cuisineId) {
      logger?.warn("Receta de Gemini descartada: cocina no resoluble.", {
        cuisine: recipe.cuisine,
      });
      continue;
    }

    const domainRecipe = mapGeminiRecipeToDomain({ recipe, input, cuisineId });

    // El slug es UNIQUE en la base: se conserva solo el primero.
    if (seenSlugs.has(domainRecipe.slug)) {
      logger?.debug("Receta de Gemini duplicada descartada.", {
        slug: domainRecipe.slug,
      });
      continue;
    }
    seenSlugs.add(domainRecipe.slug);
    mapped.push({
      recipe: domainRecipe,
      ingredients: recipe.ingredients.map((ingredient) => ({
        id: null,
        name: ingredient.name,
        normalizedName: normalizeIngredientName(ingredient.name),
        isPantryStaple: false,
        optional: ingredient.optional ?? false,
      })),
    });
  }

  return mapped;
}

/** Registra el fallo clasificado sin filtrar detalles técnicos al usuario. */
function logProviderError(error: unknown, logger?: Logger): void {
  if (error instanceof GeminiClientError) {
    logger?.warn("No se pudieron generar recetas con Gemini.", {
      code: error.code,
    });
    return;
  }
  logger?.error("Error inesperado al generar recetas con Gemini.", {
    error: error instanceof Error ? error.message : String(error),
  });
}

function isUniqueConstraintViolation(error: unknown): boolean {
  return error instanceof RepositoryError && error.details?.code === "23505";
}

/** Persists one recipe without letting a repository failure abort the batch. */
async function persistRecipe(
  recipe: Recipe,
  recipeRepository: RecipeRepository,
  logger?: Logger,
): Promise<Recipe | null> {
  try {
    const existingRecipe = await recipeRepository.findBySlug(recipe.slug);
    if (existingRecipe) {
      if (existingRecipe.source === "AI_GENERATED") {
        return existingRecipe;
      }

      logger?.warn("Receta generada descartada por conflicto de slug.", {
        slug: recipe.slug,
      });
      return null;
    }

    try {
      return await recipeRepository.save(recipe);
    } catch (error) {
      if (isUniqueConstraintViolation(error)) {
        const racedRecipe = await recipeRepository.findBySlug(recipe.slug);
        if (racedRecipe?.source === "AI_GENERATED") {
          return racedRecipe;
        }
      }

      logger?.warn("No se pudo persistir una receta generada; se descarta.", {
        slug: recipe.slug,
      });
      return null;
    }
  } catch {
    logger?.warn("No se pudo verificar o persistir una receta generada.", {
      slug: recipe.slug,
    });
    return null;
  }
}

/**
 * Crea el proveedor externo de recetas basado en Gemini.
 *
 * Si no hay API key y no se inyecta un cliente, el proveedor se construye en
 * modo degradado: registra una advertencia; `searchByIngredients` devuelve `[]`
 * y `generateFromPrompt` devuelve `null` sin tocar la red (REQ-08).
 */
export function createGeminiRecipeProvider(
  options: GeminiRecipeProviderOptions,
): ExternalRecipeProvider & ExternalRecipePromptProvider {
  const { logger, cuisineRepository, recipeRepository } = options;
  const apiKey = options.apiKey?.trim() ?? "";

  const client =
    options.client ??
    (apiKey
      ? createGeminiClient({
          apiKey,
          model: options.model,
          baseUrl: options.baseUrl,
          timeoutMs: options.timeoutMs,
          maxRetries: options.maxRetries,
        })
      : null);

  if (!client) {
    logger?.warn(
      "GeminiRecipeProvider sin API key: se omiten las recetas generadas.",
      { provider: "gemini" },
    );
  }

  return {
    async searchByIngredients(input) {
      if (!client) {
        return [];
      }

      try {
        const cuisines = await cuisineRepository.findAll();
        const raw = await client.generateContent(
          buildPrompt(input),
          geminiResponseSchema,
        );

        const recipes = parseRecipes(raw, logger);
        const mappedRecipes = mapRecipes(recipes, input, cuisines, logger);
        const persistedCandidates: RecipeRecommendationCandidate[] = [];

        for (const candidate of mappedRecipes) {
          const persistedRecipe = await persistRecipe(
            candidate.recipe,
            recipeRepository,
            logger,
          );
          if (persistedRecipe) {
            persistedCandidates.push({ ...candidate, recipe: persistedRecipe });
          }
        }

        return persistedCandidates;
      } catch (error) {
        logProviderError(error, logger);
        return [];
      }
    },

    async generateFromPrompt(input) {
      if (!client) {
        return null;
      }

      try {
        const cuisines = await cuisineRepository.findAll();
        const cuisineNames = cuisines.map((cuisine) => cuisine.name);
        const raw = await client.generateContent(
          buildChefPrompt(input, cuisineNames),
          geminiResponseSchemaWithCuisines(cuisineNames),
        );

        const [recipe] = parseRecipes(raw, logger);
        if (!recipe) {
          logger?.warn(
            "Gemini no devolvió una receta válida para la petición.",
            { provider: "gemini" },
          );
          return null;
        }

        // El `mealType` lo decide el modelo a partir del texto del usuario; el
        // input sintético solo satisface el mapper, que no recibe filtros aquí.
        const mappingInput: ExternalRecipeSearchInput = {
          availableIngredients: [],
          mealType: recipe.mealType,
          cuisineId: null,
          cuisine: null,
        };

        const cuisineId = resolveCuisineId(recipe, mappingInput, cuisines);
        if (!cuisineId) {
          logger?.warn("Receta generada descartada: cocina no resoluble.", {
            cuisine: recipe.cuisine,
          });
          return null;
        }

        const domainRecipe = mapGeminiRecipeToDomain({
          recipe,
          input: mappingInput,
          cuisineId,
        });

        const persistedRecipe = await persistRecipe(
          domainRecipe,
          recipeRepository,
          logger,
        );
        if (!persistedRecipe) {
          return null;
        }

        const generated: GeneratedRecipe = {
          id: persistedRecipe.id,
          name: persistedRecipe.name,
          description: persistedRecipe.description,
          cuisineName:
            cuisines.find((cuisine) => cuisine.id === cuisineId)?.name ?? null,
          mealType: persistedRecipe.mealType,
          difficulty: persistedRecipe.difficulty,
          preparationTimeMinutes: persistedRecipe.preparationTime,
          servings: persistedRecipe.servings,
          ingredients: recipe.ingredients.map((ingredient) => ({
            name: ingredient.name,
            quantity: ingredient.quantity,
            unit: ingredient.unit,
            optional: ingredient.optional ?? false,
          })),
          instructions: recipe.instructions,
          source: persistedRecipe.source,
        };

        return generated;
      } catch (error) {
        logProviderError(error, logger);
        return null;
      }
    },
  };
}
