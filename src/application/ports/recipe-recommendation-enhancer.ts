import type { RecommendedRecipe } from "@/application/ports/recipe-recommendation";
import type { UserPreferences } from "@/application/ports/user-preferences";

/**
 * Punto de extensión de IA para recomendaciones (PROMTP #73, spec 07 REQ-09).
 *
 * SOLO DISEÑO: documenta el flujo futuro
 * `RecipeRecommendationService -> RecipeRecommendationEnhancer -> LLM`
 * (el motor determina las recomendaciones deterministas y luego un LLM las
 * enriquece). NO se implementa ninguna clase ni stub con lógica: en el MVP
 * cero lógica de IA se envía. Existe para fijar el contrato antes de que la
 * funcionalidad se habilite.
 */
export interface RecommendationEnhancementInput {
  recommendations: RecommendedRecipe[];
  preferences?: UserPreferences;
}

export interface RecipeRecommendationEnhancer {
  enhance(input: RecommendationEnhancementInput): Promise<RecommendedRecipe[]>;
}
