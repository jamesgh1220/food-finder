/** Receta marcada como favorita por un usuario (spec 06, REQ-06). */
export interface FavoriteRecipe {
  userId: string;
  recipeId: string;
  createdAt: Date;
}
