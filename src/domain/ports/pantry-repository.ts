import type { PantryItem } from "../entities";

/** Puerto de persistencia de la despensa de un usuario (spec 06, REQ-08). */
export interface PantryRepository {
  listByUser(userId: string): Promise<PantryItem[]>;
  findByUserAndIngredient(
    userId: string,
    ingredientId: string,
  ): Promise<PantryItem | null>;
  /** Inserta o actualiza por (userId, ingredientId). */
  upsert(item: PantryItem): Promise<PantryItem>;
  remove(userId: string, ingredientId: string): Promise<void>;
  clearByUser(userId: string): Promise<void>;
}
