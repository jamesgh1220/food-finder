/**
 * Normalización de nombres de ingredientes (spec 06, REQ-10; PROMTP #50).
 *
 * Hoy no hay NLP: el pipeline por defecto solo recorta, pasa a minúsculas y
 * colapsa espacios internos. El pipeline de pasos es el punto de extensión
 * para sinónimos, traducciones, plurales y nombres regionales
 * (p. ej. aguacate / avocado / palta) sin reescribir el dominio.
 */
export type NormalizationStep = (input: string) => string;

/** Paso 1: recorta espacios al inicio y al final. */
export const trimStep: NormalizationStep = (input) => input.trim();

/** Paso 2: unifica a minúsculas para comparación case-insensitive. */
export const lowercaseStep: NormalizationStep = (input) => input.toLowerCase();

/** Paso 3: colapsa cualquier secuencia de espacios internos a uno solo. */
export const collapseWhitespaceStep: NormalizationStep = (input) =>
  input.replace(/\s+/g, " ");

/** Pipeline por defecto aplicado de izquierda a derecha. */
export const DEFAULT_NORMALIZATION_STEPS: readonly NormalizationStep[] = [
  trimStep,
  lowercaseStep,
  collapseWhitespaceStep,
];

/**
 * Normaliza un nombre de ingrediente aplicando el pipeline de pasos.
 * Una entrada vacía o solo espacios devuelve "".
 */
export function normalizeIngredientName(
  name: string,
  steps: readonly NormalizationStep[] = DEFAULT_NORMALIZATION_STEPS,
): string {
  return steps.reduce((current, step) => step(current), name);
}
