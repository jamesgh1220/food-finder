import type { Recipe } from "@/domain/entities";
import type { RecipeRepository } from "@/domain/ports";
import type { MealType } from "@/domain/value-objects";

export interface GetRecipesByMealTypeInput {
  mealType: MealType;
}

/**
 * Caso de uso GetRecipesByMealType (spec 07).
 *
 * Lectura pública: filtra el catálogo por tipo de comida.
 */
export class GetRecipesByMealType {
  constructor(private readonly recipes: RecipeRepository) {}

  async execute(input: GetRecipesByMealTypeInput): Promise<Recipe[]> {
    return this.recipes.findMany({ mealType: input.mealType });
  }
}
