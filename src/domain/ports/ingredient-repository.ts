import type { Ingredient } from "../entities";

/** Puerto de persistencia de ingredientes (spec 06, REQ-08). */
export interface IngredientRepository {
  findById(id: string): Promise<Ingredient | null>;
  findByNormalizedName(normalizedName: string): Promise<Ingredient | null>;
  findMany(query?: string): Promise<Ingredient[]>;
  findByNormalizedNames(names: string[]): Promise<Ingredient[]>;
  /** Crea o actualiza el ingrediente (semántica upsert). */
  save(ingredient: Ingredient): Promise<Ingredient>;
}
