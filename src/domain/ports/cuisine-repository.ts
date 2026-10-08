import type { Cuisine } from "../entities";

/** Puerto de lectura del catálogo de cocinas (spec 06, REQ-08). */
export interface CuisineRepository {
  findAll(): Promise<Cuisine[]>;
  findById(id: string): Promise<Cuisine | null>;
  findBySlug(slug: string): Promise<Cuisine | null>;
}
