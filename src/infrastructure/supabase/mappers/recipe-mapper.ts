import { RECIPE_SOURCES, type Difficulty, type Recipe } from "@/domain/entities";
import type { RecipeSource } from "@/domain/entities";
import { RepositoryError } from "@/domain/errors";
import { isMealType } from "@/domain/value-objects";
import type { Tables } from "@/types/database.types";

/**
 * Mapeador fila↔entidad de recetas (spec 05/06).
 *
 * Frontera de normalización de nulos: las columnas anulables que el dominio
 * exige no nulas se traducen a valores neutros. Solo se lanza
 * `RepositoryError` cuando NO existe un valor neutro razonable (aquí,
 * `cuisine_id`, porque toda receta pertenece a una cocina).
 */

/** Dificultades admitidas por el dominio; cualquier otro valor cae a `null`. */
const DIFFICULTIES: readonly Difficulty[] = ["EASY", "MEDIUM", "HARD"];

/** Normaliza la dificultad: solo EASY/MEDIUM/HARD son válidas. */
function toDifficulty(value: string | null): Difficulty | null {
  return (DIFFICULTIES as readonly string[]).includes(value ?? "")
    ? (value as Difficulty)
    : null;
}

/** Traduce una fila `recipes` a la entidad `Recipe` del dominio. */
export function toRecipe(row: Tables<"recipes">): Recipe {
  if (row.cuisine_id === null) {
    throw new RepositoryError("La receta no tiene cocina asociada.", {
      recipeId: row.id,
    });
  }

  // meal_type nulo o desconocido → "ANY" (receta apta para cualquier momento).
  const mealType = isMealType(row.meal_type) ? row.meal_type : "ANY";

  // source nulo o fuera del catálogo → "OTHER".
  const source = (RECIPE_SOURCES as readonly string[]).includes(row.source ?? "")
    ? (row.source as RecipeSource)
    : "OTHER";

  return {
    id: row.id,
    name: row.name,
    slug: row.slug,
    description: row.description,
    cuisineId: row.cuisine_id,
    country: row.country,
    region: row.region,
    mealType,
    instructions: row.instructions ?? "",
    preparationTime: row.preparation_time ?? 0,
    cookingTime: row.cooking_time,
    servings: row.servings ?? 1,
    difficulty: toDifficulty(row.difficulty),
    imageUrl: row.image_url,
    source,
    sourceUrl: row.source_url,
    createdAt: new Date(row.created_at),
    updatedAt: new Date(row.updated_at),
  };
}
