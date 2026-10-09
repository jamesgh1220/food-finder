import type { FavoriteRecipe } from "@/domain/entities";
import type { Tables, TablesInsert } from "@/types/database.types";

/** Mapeador fila↔entidad de recetas favoritas (spec 05/06). */

/** Traduce una fila `favorite_recipes` a la entidad `FavoriteRecipe`. */
export function toFavoriteRecipe(
  row: Tables<"favorite_recipes">,
): FavoriteRecipe {
  return {
    userId: row.user_id,
    recipeId: row.recipe_id,
    createdAt: new Date(row.created_at),
  };
}

/**
 * Traduce una entidad `FavoriteRecipe` a la fila de escritura. Se omiten
 * `id` y `created_at`: los genera la base de datos en el insert.
 */
export function toFavoriteRecipeWrite(
  favorite: FavoriteRecipe,
): Pick<TablesInsert<"favorite_recipes">, "user_id" | "recipe_id"> {
  return {
    user_id: favorite.userId,
    recipe_id: favorite.recipeId,
  };
}
