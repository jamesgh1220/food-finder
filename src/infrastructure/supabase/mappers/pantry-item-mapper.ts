import type { PantryItem } from "@/domain/entities";
import { Quantity, Unit } from "@/domain/value-objects";
import type { Tables, TablesInsert } from "@/types/database.types";

/**
 * Mapeador fila↔entidad de ítems de despensa (spec 05/06).
 *
 * Frontera de normalización: `quantity`/`unit` anulables → cantidad 0 y
 * unidad "unit" cuando son nulos, porque el dominio exige value objects.
 */

/** Traduce una fila `pantry_items` a la entidad `PantryItem`. */
export function toPantryItem(row: Tables<"pantry_items">): PantryItem {
  return {
    id: row.id,
    userId: row.user_id,
    ingredientId: row.ingredient_id,
    quantity: Quantity.create(row.quantity ?? 0),
    unit: Unit.create(row.unit ?? "unit"),
    createdAt: new Date(row.created_at),
    updatedAt: new Date(row.updated_at),
  };
}

/**
 * Traduce una entidad `PantryItem` a la fila de escritura. Se omiten a
 * propósito `id` y timestamps: un upsert sobre `(user_id, ingredient_id)`
 * conserva el id existente y deja que el trigger de `updated_at` actúe.
 */
export function toPantryItemWrite(
  item: PantryItem,
): Pick<
  TablesInsert<"pantry_items">,
  "user_id" | "ingredient_id" | "quantity" | "unit"
> {
  return {
    user_id: item.userId,
    ingredient_id: item.ingredientId,
    quantity: item.quantity.value,
    unit: item.unit.value,
  };
}
