/** Ingrediente del catálogo (spec 06, REQ-03; PROMTP #10). */
export interface Ingredient {
  id: string;
  name: string;
  /** Clave normalizada para deduplicar variantes (case-insensitive). */
  normalizedName: string;
  category: string | null;
  isPantryStaple: boolean;
  createdAt: Date;
  updatedAt: Date;
}
