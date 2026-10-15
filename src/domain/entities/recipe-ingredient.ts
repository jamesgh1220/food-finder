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

/**
 * Entrada de escritura de la relación receta↔ingrediente (spec 09, REQ-07).
 *
 * El nombre viaja **sin resolver** a propósito: el catálogo `ingredients` es
 * global y quien genera la receta (un proveedor externo) no conoce —ni debe
 * conocer— los ids del catálogo. Resolverlo o crearlo es responsabilidad de la
 * capa de persistencia.
 *
 * `quantity`/`unit` son anulables por la misma razón que en el read model: la
 * columna lo es y la generación puede no traer cantidad ni unidad.
 */
export interface RecipeIngredientInput {
  name: string;
  quantity: number | null;
  unit: string | null;
  optional: boolean;
}
