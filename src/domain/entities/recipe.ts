import type { MealType } from "../value-objects";

/**
 * Orígenes posibles de una receta (spec 06, REQ-01).
 *
 * Hoy solo se usan INTERNAL y SPOONACULAR; AI_GENERATED y OTHER existen para
 * que el modelo no requiera rediseño cuando se habiliten más adelante.
 */
export const RECIPE_SOURCES = [
  "INTERNAL",
  "SPOONACULAR",
  "AI_GENERATED",
  "OTHER",
] as const;

export type RecipeSource = (typeof RECIPE_SOURCES)[number];

/**
 * Dificultad de preparación.
 *
 * El SPEC no fija el conjunto de valores; esta es la convención interna del
 * proyecto.
 */
export type Difficulty = "EASY" | "MEDIUM" | "HARD";

/** Receta del catálogo (spec 06, REQ-01; PROMTP #10). */
export interface Recipe {
  id: string;
  name: string;
  slug: string;
  description: string | null;
  cuisineId: string;
  country: string | null;
  region: string | null;
  mealType: MealType;
  instructions: string;
  /** Tiempo de preparación en minutos. */
  preparationTime: number;
  /** Tiempo de cocción en minutos; null cuando no aplica. */
  cookingTime: number | null;
  servings: number;
  difficulty: Difficulty | null;
  imageUrl: string | null;
  source: RecipeSource;
  sourceUrl: string | null;
  createdAt: Date;
  updatedAt: Date;
}
