import type { Recipe } from "@/domain/entities";
import type { RecipeRepository } from "@/domain/ports";
import { NotFoundError } from "@/domain/errors";

export interface GetRecipeByIdInput {
  id: string;
}

/**
 * Caso de uso GetRecipeById (spec 07).
 *
 * Lectura pública del detalle de una receta; no requiere sesión.
 */
export class GetRecipeById {
  constructor(private readonly recipes: RecipeRepository) {}

  async execute(input: GetRecipeByIdInput): Promise<Recipe> {
    const recipe = await this.recipes.findById(input.id);
    if (!recipe) {
      throw new NotFoundError("Receta no encontrada.");
    }
    return recipe;
  }
}
