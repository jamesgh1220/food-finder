import type { FavoriteRecipe } from "@/domain/entities";
import type { FavoriteRepository, RecipeRepository } from "@/domain/ports";
import { ConflictError, NotFoundError } from "@/domain/errors";
import type { AuthPort } from "@/application/ports/auth";
import { requireAuthenticatedUser } from "@/application/shared/require-authenticated-user";

export interface AddFavoriteRecipeInput {
  recipeId: string;
}

/**
 * Caso de uso AddFavoriteRecipe (spec 07).
 *
 * Exige sesión, verifica que la receta exista y que no sea ya favorita del
 * usuario de la sesión. El `userId` sale siempre de la sesión, nunca del
 * input del cliente.
 */
export class AddFavoriteRecipe {
  constructor(
    private readonly favorites: FavoriteRepository,
    private readonly recipes: RecipeRepository,
    private readonly auth: AuthPort,
  ) {}

  async execute(input: AddFavoriteRecipeInput): Promise<FavoriteRecipe> {
    const user = await requireAuthenticatedUser(this.auth);

    const recipe = await this.recipes.findById(input.recipeId);
    if (!recipe) {
      throw new NotFoundError("Receta no encontrada.");
    }

    if (await this.favorites.exists(user.id, input.recipeId)) {
      throw new ConflictError("La receta ya está en favoritos.");
    }

    return this.favorites.add({
      userId: user.id,
      recipeId: input.recipeId,
      createdAt: new Date(),
    });
  }
}
