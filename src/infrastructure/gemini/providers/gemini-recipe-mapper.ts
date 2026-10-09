import type { ExternalRecipeSearchInput } from "@/application/ports/external-recipe-provider";
import type { Cuisine, Recipe } from "@/domain/entities";
import type { GeminiRecipe } from "../schemas";

/**
 * Mapper `GeminiRecipe → Recipe` (spec 09, REQ-07/REQ-11).
 *
 * Última etapa del pipeline: convierte una receta ya validada por Zod en una
 * entidad del dominio, resolviendo la cocina contra el catálogo. Nada de esto
 * conoce la API de Gemini: no hay campos crudos del modelo.
 */

/**
 * Genera un slug a partir del nombre: minúsculas, sin acentos, espacios a
 * guiones y sin caracteres no alfanuméricos.
 *
 * El slug es UNIQUE en la base; las colisiones se resuelven en la capa de
 * persistencia (fallo de constraint), no aquí (spec 09).
 */
export function slugify(name: string): string {
  return name
    .normalize("NFD")
    .replace(/[\u0300-\u036f]/g, "")
    .toLowerCase()
    .trim()
    .replace(/[^a-z0-9\s-]/g, "")
    .replace(/\s+/g, "-")
    .replace(/-+/g, "-")
    .replace(/^-+|-+$/g, "");
}

/** Normaliza un nombre de cocina para comparar sin acentos ni mayúsculas. */
function normalizeCuisineName(value: string): string {
  return slugify(value);
}

/**
 * Resuelve el `cuisineId` de una receta generada (spec 09).
 *
 * 1. Busca en el catálogo una cocina cuyo nombre coincida con el de Gemini.
 * 2. Si no hay coincidencia, recurre al `cuisineId` del input cuando la cocina
 *    pedida coincide con la generada o cuando no se pidió cocina.
 * 3. Si nada resuelve, devuelve `null` y el llamador descarta la receta.
 */
export function resolveCuisineId(
  recipe: GeminiRecipe,
  input: ExternalRecipeSearchInput,
  cuisines: Cuisine[],
): string | null {
  const target = normalizeCuisineName(recipe.cuisine);
  const match = cuisines.find(
    (cuisine) => normalizeCuisineName(cuisine.name) === target,
  );
  if (match) {
    return match.id;
  }

  if (input.cuisineId) {
    const requested = (input.cuisine ?? "").trim();
    if (requested === "") {
      return input.cuisineId;
    }
    const requestedCuisine = cuisines.find(
      (cuisine) => cuisine.id === input.cuisineId,
    );
    if (
      requestedCuisine &&
      normalizeCuisineName(requestedCuisine.name) === target
    ) {
      return input.cuisineId;
    }
  }

  return null;
}

/** Datos necesarios para mapear una receta de Gemini al dominio. */
export interface MapGeminiRecipeInput {
  recipe: GeminiRecipe;
  input: ExternalRecipeSearchInput;
  /** Cocina ya resuelta (nunca nula: el llamador descarta si no se resuelve). */
  cuisineId: string;
}

/**
 * Mapea una receta de Gemini validada a una entidad `Recipe`.
 *
 * El `mealType` y el `id` de cocina vienen del input del producto (REQ-11);
 * la cocina generada se usa solo para resolverla contra el catálogo. La receta
 * se marca como `AI_GENERATED` y sin `sourceUrl` real (REQ-07).
 */
export function mapGeminiRecipeToDomain({
  recipe,
  input,
  cuisineId,
}: MapGeminiRecipeInput): Recipe {
  const now = new Date();

  return {
    id: crypto.randomUUID(),
    name: recipe.name,
    slug: slugify(recipe.name),
    description: recipe.description ?? null,
    cuisineId,
    country: null,
    region: null,
    mealType: input.mealType,
    instructions: recipe.instructions.join("\n"),
    preparationTime: recipe.preparationTimeMinutes,
    cookingTime: null,
    servings: recipe.servings,
    difficulty: recipe.difficulty ?? null,
    imageUrl: null,
    source: "AI_GENERATED",
    sourceUrl: null,
    createdAt: now,
    updatedAt: now,
  };
}
