import type { Recipe } from "@/domain/entities";
import type { FavoriteRepository, RecipeRepository } from "@/domain/ports";
import type { AuthPort } from "@/application/ports/auth";
import { requireAuthenticatedUser } from "@/application/shared/require-authenticated-user";

/**
 * Caso de uso GetFavoriteRecipes (spec 07).
 *
 * Devuelve SOLO las recetas favoritas del usuario de la sesión: primero lista
 * las referencias del usuario y luego resuelve las recetas por id. Si no hay
 * favoritos, evita consultar el catálogo.
 */
export class GetFavoriteRecipes {
  constructor(
    private readonly favorites: FavoriteRepository,
    private readonly recipes: RecipeRepository,
    private readonly auth: AuthPort,
  ) {}

  async execute(): Promise<Recipe[]> {
    const user = await requireAuthenticatedUser(this.auth);

    const favorites = await this.favorites.listByUser(user.id);
    if (favorites.length === 0) {
      return [];
    }

    const recipeIds = favorites.map((favorite) => favorite.recipeId);
    return this.recipes.findByIds(recipeIds);
  }
}
