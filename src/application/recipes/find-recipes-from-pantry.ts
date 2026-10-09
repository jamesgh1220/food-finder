import type { MealType } from "@/domain/value-objects";
import type { RecipeRecommendationService, RecommendedRecipe } from "@/application/ports/recipe-recommendation";
import type { AuthPort } from "@/application/ports/auth";
import { requireAuthenticatedUser } from "@/application/shared/require-authenticated-user";

export interface FindRecipesFromPantryInput {
  ingredientIds: string[];
  mealType?: MealType;
  /** null/undefined = ALL: sin filtro de cocina (multi-cocina). */
  cuisineId?: string | null;
}

/**
 * Caso de uso FindRecipesFromPantry (spec 07).
 *
 * Exige sesión y delega en el motor de recomendación. La cocina es OPCIONAL:
 * cuando `cuisineId` es null/undefined NO se envía filtro de cocina (default
 * ALL), de modo que el resultado puede abarcar varias cocinas.
 */
export class FindRecipesFromPantry {
  constructor(
    private readonly recommendations: RecipeRecommendationService,
    private readonly auth: AuthPort,
  ) {}

  async execute(
    input: FindRecipesFromPantryInput,
  ): Promise<RecommendedRecipe[]> {
    await requireAuthenticatedUser(this.auth);

    return this.recommendations.recommend({
      availableIngredientIds: input.ingredientIds,
      mealType: input.mealType,
      cuisineId: input.cuisineId ?? undefined,
    });
  }
}
