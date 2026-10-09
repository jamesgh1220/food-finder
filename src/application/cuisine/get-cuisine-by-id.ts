import type { Cuisine } from "@/domain/entities";
import type { CuisineRepository } from "@/domain/ports";
import { NotFoundError } from "@/domain/errors";

export interface GetCuisineByIdInput {
  id: string;
}

/**
 * Caso de uso GetCuisineById (spec 07).
 *
 * Lectura pública de una cocina concreta; lanza `NotFoundError` si el id no
 * existe en el catálogo.
 */
export class GetCuisineById {
  constructor(private readonly cuisines: CuisineRepository) {}

  async execute(input: GetCuisineByIdInput): Promise<Cuisine> {
    const cuisine = await this.cuisines.findById(input.id);
    if (!cuisine) {
      throw new NotFoundError("Cocina no encontrada.");
    }
    return cuisine;
  }
}
