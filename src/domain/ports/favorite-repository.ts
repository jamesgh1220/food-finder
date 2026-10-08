import type { FavoriteRecipe } from "../entities";

/** Puerto de persistencia de recetas favoritas (spec 06, REQ-08). */
export interface FavoriteRepository {
  listByUser(userId: string): Promise<FavoriteRecipe[]>;
  exists(userId: string, recipeId: string): Promise<boolean>;
  add(favorite: FavoriteRecipe): Promise<FavoriteRecipe>;
  remove(userId: string, recipeId: string): Promise<void>;
}
