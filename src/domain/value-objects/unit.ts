import { ValidationError } from "../errors";

/**
 * Unidad de medida (spec 06, REQ-07).
 *
 * El SPEC no enumera las unidades, así que se modela como una cadena libre
 * validada (no vacía tras recortar espacios). Ejemplos: "g", "ml", "taza".
 */
export class Unit {
  readonly value: string;

  private constructor(value: string) {
    this.value = value;
  }

  /** Crea la unidad recortando espacios y validando que no quede vacía. */
  static create(raw: string): Unit {
    if (typeof raw !== "string") {
      throw new ValidationError("La unidad debe ser un texto", { value: raw });
    }
    const value = raw.trim();
    if (value.length === 0) {
      throw new ValidationError("La unidad no puede estar vacía", {
        value: raw,
      });
    }
    return new Unit(value);
  }

  /** Igualdad por valor. */
  equals(other: Unit): boolean {
    return this.value === other.value;
  }
}
