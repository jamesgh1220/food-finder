import { ValidationError } from "../errors";

/**
 * Tipos de comida soportados (spec 06, REQ-07).
 *
 * El conjunto es una convención interna: el SPEC fija exactamente estos 6
 * valores. "ANY" representa "cualquier momento del día".
 */
export const MEAL_TYPES = [
  "BREAKFAST",
  "LUNCH",
  "DINNER",
  "SNACK",
  "DESSERT",
  "ANY",
] as const;

export type MealType = (typeof MEAL_TYPES)[number];

/** Comprueba, en runtime, si un valor desconocido es un MealType válido. */
export function isMealType(value: unknown): value is MealType {
  return (
    typeof value === "string" &&
    (MEAL_TYPES as readonly string[]).includes(value)
  );
}

/** Valida y devuelve el MealType; lanza ValidationError si no es válido. */
export function parseMealType(value: unknown): MealType {
  if (!isMealType(value)) {
    throw new ValidationError(`Tipo de comida inválido: ${String(value)}`, {
      value,
    });
  }
  return value;
}
