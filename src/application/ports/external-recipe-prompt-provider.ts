import type { Difficulty, RecipeSource } from "@/domain/entities";
import type { MealType } from "@/domain/value-objects";

/**
 * Puerto de proveedores externos que generan UNA receta a partir de una
 * petición libre del usuario.
 *
 * Es un puerto SEPARADO de `ExternalRecipeProvider` a propósito: aquel describe
 * la búsqueda por ingredientes y lo consumen (y mockean por forma) el motor de
 * recomendación y sus tests. Este describe el flujo conversacional del
 * dashboard ("cuéntame qué tienes y qué quieres cocinar") y ninguna capa
 * interna conoce a Gemini: solo esta interfaz.
 *
 * Contrato de fallo: la implementación NUNCA lanza y NUNCA expone detalles
 * técnicos. Ante ausencia de API key, timeout, cuota, respuesta inválida o
 * cocina no resoluble devuelve `null` (degradación elegante).
 */

/** Petición libre del usuario. */
export interface ExternalRecipePromptInput {
  /** Texto tal cual lo escribió el usuario (ya recortado por el llamador). */
  prompt: string;
}

/** Ingrediente generado con su cantidad/unidad resueltas por el modelo. */
export interface GeneratedRecipeIngredient {
  name: string;
  quantity: number | null;
  unit: string | null;
  optional: boolean;
}

/**
 * Read model de la receta generada.
 *
 * Solo datos serializables: cruza la frontera de una Server Action hasta un
 * Client Component. `id` es el identificador estable de la receta ya persistida,
 * así que puede guardarse en favoritos.
 */
export interface GeneratedRecipe {
  id: string;
  name: string;
  description: string | null;
  /** Nombre de la cocina resuelta contra el catálogo (display). */
  cuisineName: string | null;
  mealType: MealType;
  difficulty: Difficulty | null;
  preparationTimeMinutes: number;
  servings: number;
  ingredients: GeneratedRecipeIngredient[];
  /** Pasos de preparación ya ordenados y sin numeración. */
  instructions: string[];
  source: RecipeSource;
}

/** Contrato de un proveedor externo que genera una receta desde texto libre. */
export interface ExternalRecipePromptProvider {
  generateFromPrompt(
    input: ExternalRecipePromptInput,
  ): Promise<GeneratedRecipe | null>;
}
