import type { Cuisine } from "@/domain/entities";
import type { CuisineRepository } from "@/domain/ports";

/**
 * Caso de uso GetCuisines (spec 07).
 *
 * Lectura pública del catálogo de cocinas; no requiere sesión.
 */
export class GetCuisines {
  constructor(private readonly cuisines: CuisineRepository) {}

  async execute(): Promise<Cuisine[]> {
    return this.cuisines.findAll();
  }
}
