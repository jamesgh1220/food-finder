import type { RecipeIngredientDetail } from "@/domain/entities";

/**
 * Mapeador de la proyección receta↔ingrediente (spec 14, REQ-02).
 *
 * La fila `recipe_ingredients` llega con el ingrediente embebido
 * (`ingredients(id, name)`). Si el embed viene vacío (integridad rota) se
 * descarta la fila en lugar de inventar un nombre: el dominio no admite
 * ingredientes sin nombre.
 */
export interface RecipeIngredientRow {
  ingredient_id: string;
  quantity: number | null;
  unit: string | null;
  optional: boolean;
  notes: string | null;
  ingredients: { id: string; name: string } | null;
}

/** Traduce una fila embebida a la proyección de lectura, o `null` si está rota. */
export function toRecipeIngredientDetail(
  row: RecipeIngredientRow,
): RecipeIngredientDetail | null {
  if (!row.ingredients || row.ingredients.name.length === 0) {
    return null;
  }

  return {
    ingredientId: row.ingredient_id,
    name: row.ingredients.name,
    quantity: row.quantity,
    unit: row.unit,
    optional: row.optional,
    notes: row.notes,
  };
}
