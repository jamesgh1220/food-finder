import type { Recipe } from "./recipe";

export interface RecipeRecommendationIngredient {
  id: string | null;
  name: string;
  normalizedName: string;
  isPantryStaple: boolean;
  optional: boolean;
}

/** Recipe aggregate with the ingredient catalog data used for matching. */
export interface RecipeRecommendationCandidate {
  recipe: Recipe;
  ingredients: RecipeRecommendationIngredient[];
}
