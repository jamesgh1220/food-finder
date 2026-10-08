import { ValidationError } from "../errors";

/**
 * Cantidad de un ingrediente (spec 06, REQ-07).
 *
 * Número finito mayor o igual que 0; se permiten decimales (p. ej. 0.5 kg).
 */
export class Quantity {
  readonly value: number;

  private constructor(value: number) {
    this.value = value;
  }

  /** Crea la cantidad validando finitud y no negatividad. */
  static create(value: number): Quantity {
    if (typeof value !== "number" || !Number.isFinite(value)) {
      throw new ValidationError("La cantidad debe ser un número finito", {
        value,
      });
    }
    if (value < 0) {
      throw new ValidationError("La cantidad no puede ser negativa", { value });
    }
    return new Quantity(value);
  }

  /** Igualdad por valor. */
  equals(other: Quantity): boolean {
    return this.value === other.value;
  }
}
