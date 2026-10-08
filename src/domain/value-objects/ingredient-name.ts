import { ValidationError } from "../errors";

/**
 * Nombre de ingrediente tal como lo escribe el usuario (spec 06, REQ-07).
 *
 * Solo recorta espacios y valida que no quede vacío. La normalización
 * (minúsculas, colapso de espacios) vive en `src/domain/normalization`; este
 * value object conserva el nombre crudo recortado.
 */
export class IngredientName {
  readonly value: string;

  private constructor(value: string) {
    this.value = value;
  }

  /** Crea el nombre recortando espacios y validando que no quede vacío. */
  static create(raw: string): IngredientName {
    if (typeof raw !== "string") {
      throw new ValidationError(
        "El nombre del ingrediente debe ser un texto",
        { value: raw },
      );
    }
    const value = raw.trim();
    if (value.length === 0) {
      throw new ValidationError(
        "El nombre del ingrediente no puede estar vacío",
        { value: raw },
      );
    }
    return new IngredientName(value);
  }

  /** Igualdad por valor (comparación cruda, sin normalizar). */
  equals(other: IngredientName): boolean {
    return this.value === other.value;
  }
}
