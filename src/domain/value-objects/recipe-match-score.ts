import { ValidationError } from "../errors";

/**
 * Puntaje de coincidencia de una receta (spec 06, REQ-07; PROMTP #15).
 *
 * Valor inmutable en el rango inclusivo 0..1. La interpretación como
 * porcentaje ("92% de coincidencia") es responsabilidad de la UI.
 */
export class RecipeMatchScore {
  readonly value: number;

  private constructor(value: number) {
    this.value = value;
  }

  /** Crea el value object validando rango y finitud. */
  static create(value: number): RecipeMatchScore {
    if (typeof value !== "number" || !Number.isFinite(value)) {
      throw new ValidationError(
        "El puntaje de coincidencia debe ser un número finito",
        { value },
      );
    }
    if (value < 0 || value > 1) {
      throw new ValidationError(
        "El puntaje de coincidencia debe estar entre 0 y 1",
        { value },
      );
    }
    return new RecipeMatchScore(value);
  }

  /** Igualdad por valor. */
  equals(other: RecipeMatchScore): boolean {
    return this.value === other.value;
  }
}
