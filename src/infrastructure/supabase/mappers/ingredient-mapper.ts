import type { Ingredient } from "@/domain/entities";
import type { Tables, TablesInsert } from "@/types/database.types";

/**
 * Mapeador fila↔entidad de ingredientes (spec 05/06).
 *
 * Frontera de normalización: `is_pantry_staple` anulable → `false` cuando es
 * nulo, porque el dominio exige un booleano.
 */

/** Traduce una fila `ingredients` a la entidad `Ingredient`. */
export function toIngredient(row: Tables<"ingredients">): Ingredient {
  return {
    id: row.id,
    name: row.name,
    normalizedName: row.normalized_name,
    category: row.category,
    isPantryStaple: row.is_pantry_staple ?? false,
    createdAt: new Date(row.created_at),
    updatedAt: new Date(row.updated_at),
  };
}

/** Traduce una entidad `Ingredient` a su fila de inserción en snake_case. */
export function toIngredientWrite(
  ingredient: Ingredient,
): TablesInsert<"ingredients"> {
  return {
    id: ingredient.id,
    name: ingredient.name,
    normalized_name: ingredient.normalizedName,
    category: ingredient.category,
    is_pantry_staple: ingredient.isPantryStaple,
    created_at: ingredient.createdAt.toISOString(),
    updated_at: ingredient.updatedAt.toISOString(),
  };
}
