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

/**
 * Read model de la relación receta↔ingrediente con el nombre del ingrediente
 * resuelto (spec 14, REQ-02; PROMTP #10/#43).
 *
 * Es una proyección de lectura para la UI de detalle: `quantity`/`unit` son
 * anulables a propósito porque la columna lo es, y forzar `Quantity`/`Unit`
 * exigiría inventar un valor (`Unit` no admite vacío). El nombre viaja ya
 * resuelto para no obligar a la presentación a cruzar catálogos.
 */
export interface RecipeIngredientDetail {
  ingredientId: string;
  name: string;
  quantity: number | null;
  unit: string | null;
  optional: boolean;
  notes: string | null;
}
