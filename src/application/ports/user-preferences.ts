import type { Difficulty } from "@/domain/entities";

/**
 * Preferencias de usuario (PROMTP #87, spec 07 REQ-09).
 *
 * SOLO DISEÑO: esta forma describe la futura personalización de
 * recomendaciones, pero NO se usa ni se implementa en el MVP. Ningún caso de
 * uso la lee todavía; existe para que el modelo no requiera rediseño cuando
 * se habilite la personalización completa.
 *
 * Todos los campos son opcionales: representan filtros que el usuario podrá
 * configurar más adelante.
 */
export interface UserPreferences {
  preferredCuisines?: string[];
  excludedIngredients?: string[];
  diet?: string;
  allergies?: string[];
  maxPreparationTime?: number; // minutos
  difficulty?: Difficulty;
  budget?: "LOW" | "MEDIUM" | "HIGH";
}
