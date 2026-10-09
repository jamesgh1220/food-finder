import type { Difficulty, Recipe } from "@/domain/entities";
import type { MealType, RecipeMatchScore } from "@/domain/value-objects";
import type { UserPreferences } from "@/application/ports/user-preferences";

/**
 * Puerto del motor de recomendación (PROMTP #71, spec 07 REQ-08).
 *
 * Es la dependencia de frontera de `FindRecipesFromPantry`: el caso de uso
 * conoce solo esta interfaz y la implementación real llega en la spec 10
 * (infraestructura). Mantenerlo como puerto permite testear los casos de uso
 * con un servicio falso, sin motor de recomendación ni base de datos.
 */
export interface RecipeRecommendationRequest {
  availableIngredientIds: string[];
  mealType?: MealType;
  /** null/undefined = ALL (sin filtro de cocina). */
  cuisineId?: string | null;
  maxPreparationTime?: number;
  difficulty?: Difficulty;
  preferences?: UserPreferences;
}

export interface RecommendedRecipe {
  recipe: Recipe;
  matchScore: RecipeMatchScore;
  availableIngredients: string[];
  missingIngredients: string[];
  optionalMissingIngredients: string[];
}

export interface RecipeRecommendationService {
  recommend(
    request: RecipeRecommendationRequest,
  ): Promise<RecommendedRecipe[]>;
}
