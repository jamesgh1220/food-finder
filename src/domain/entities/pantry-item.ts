import type { Quantity, Unit } from "../value-objects";

/** Ingrediente guardado en la despensa de un usuario (spec 06, REQ-05). */
export interface PantryItem {
  id: string;
  userId: string;
  ingredientId: string;
  quantity: Quantity;
  unit: Unit;
  createdAt: Date;
  updatedAt: Date;
}
