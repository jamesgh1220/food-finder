import type { Recipe } from "../entities";
import type { MealType } from "../value-objects";

/** Filtro de búsqueda de recetas usado por los casos de uso (spec 06, REQ-08). */
export interface RecipeFilter {
  cuisineId?: string;
  mealType?: MealType;
  search?: string;
  ids?: string[];
}

/**
 * Puerto de persistencia de recetas (spec 06, REQ-08).
 *
 * Interfaz pura, independiente de Supabase: la implementación vive en
 * infraestructura y es reemplazable por un mock en los tests.
 */
export interface RecipeRepository {
  findById(id: string): Promise<Recipe | null>;
  findBySlug(slug: string): Promise<Recipe | null>;
  findByIds(ids: string[]): Promise<Recipe[]>;
  findMany(filter?: RecipeFilter): Promise<Recipe[]>;
}
