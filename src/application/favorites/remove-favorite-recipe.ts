import type { FavoriteRepository } from "@/domain/ports";
import type { AuthPort } from "@/application/ports/auth";
import { requireAuthenticatedUser } from "@/application/shared/require-authenticated-user";

export interface RemoveFavoriteRecipeInput {
  recipeId: string;
}

/**
 * Caso de uso RemoveFavoriteRecipe (spec 07).
 *
 * Exige sesión y quita la receta de los favoritos del usuario de la sesión.
 * Idempotente: si no era favorita, el repositorio no falla.
 */
export class RemoveFavoriteRecipe {
  constructor(
    private readonly favorites: FavoriteRepository,
    private readonly auth: AuthPort,
  ) {}

  async execute(input: RemoveFavoriteRecipeInput): Promise<void> {
    const user = await requireAuthenticatedUser(this.auth);
    await this.favorites.remove(user.id, input.recipeId);
  }
}
