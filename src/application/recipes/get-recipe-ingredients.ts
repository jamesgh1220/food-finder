import type { RecipeIngredientDetail } from "@/domain/entities";
import type { RecipeRepository } from "@/domain/ports";

export interface GetRecipeIngredientsInput {
  recipeId: string;
}

/**
 * Caso de uso GetRecipeIngredients (spec 14, REQ-02; PROMTP #10/#43).
 *
 * Lectura pública de los ingredientes de una receta con su cantidad/unidad ya
 * resueltas. No exige sesión: es la misma información que el detalle de receta
 * (`GetRecipeById`), que tampoco la exige. Un id inexistente devuelve una lista
 * vacía; la página ya valida la existencia con `GetRecipeById`.
 */
export class GetRecipeIngredients {
  constructor(private readonly recipes: RecipeRepository) {}

  async execute(
    input: GetRecipeIngredientsInput,
  ): Promise<RecipeIngredientDetail[]> {
    return this.recipes.findIngredients(input.recipeId);
  }
}
