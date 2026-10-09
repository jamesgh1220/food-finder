import type { Recipe } from "@/domain/entities";
import type { RecipeRepository } from "@/domain/ports";
import type { MealType } from "@/domain/value-objects";

export interface SearchRecipesInput {
  search?: string;
  mealType?: MealType;
  cuisineId?: string;
}

/**
 * Caso de uso SearchRecipes (spec 07).
 *
 * Lectura pública del catálogo con filtros opcionales. Sin input devuelve
 * todas las recetas (filtro vacío).
 */
export class SearchRecipes {
  constructor(private readonly recipes: RecipeRepository) {}

  async execute(input: SearchRecipesInput = {}): Promise<Recipe[]> {
    return this.recipes.findMany({
      search: input.search,
      mealType: input.mealType,
      cuisineId: input.cuisineId,
    });
  }
}
