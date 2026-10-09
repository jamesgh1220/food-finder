import type { RecipeRecommendationCandidate } from "@/domain/entities";
import type { Difficulty } from "@/domain/entities";
import type { MealType } from "@/domain/value-objects";

/**
 * Puerto de proveedores externos de recetas (spec 09, REQ-01).
 *
 * Es agnóstico a Gemini y a cualquier API concreta: el dominio y los casos de
 * uso solo conocen esta interfaz. La operación es generativa ("dame recetas
 * que coincidan con estos ingredientes"), por eso NO existe `getRecipeById`:
 * las recetas generadas se persisten y luego se recuperan por el
 * `RecipeRepository` interno (REQ-07).
 */
export interface ExternalRecipeSearchInput {
  /** Nombres de ingredientes disponibles en español (para el prompt). */
  availableIngredients: string[];
  mealType: MealType;
  /** Nombre de cocina opcional (filtro del producto). */
  cuisine?: string | null;
  /** ID de cocina ya resuelto por el llamador (fallback de persistencia). */
  cuisineId?: string | null;
  /** Tiempo máximo de preparación en minutos (opcional). */
  maxPreparationTime?: number;
  difficulty?: Difficulty;
}

/** Contrato de un proveedor externo de recetas por ingredientes. */
export interface ExternalRecipeProvider {
  searchByIngredients(
    input: ExternalRecipeSearchInput,
  ): Promise<RecipeRecommendationCandidate[]>;
}
