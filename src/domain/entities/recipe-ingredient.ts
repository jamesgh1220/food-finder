import type { Quantity, Unit } from "../value-objects";

/**
 * Relación entre una receta y un ingrediente (spec 06, REQ-04; PROMTP #10).
 *
 * Entidad de join con cantidad/unidad y marca de opcionalidad.
 */
export interface RecipeIngredient {
  recipeId: string;
  ingredientId: string;
  quantity: Quantity;
  unit: Unit;
  optional: boolean;
  notes: string | null;
}
