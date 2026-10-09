import type { Cuisine } from "@/domain/entities";
import type { Tables } from "@/types/database.types";

/** Mapeador fila↔entidad de cocinas (spec 05/06). */
export function toCuisine(row: Tables<"cuisines">): Cuisine {
  return {
    id: row.id,
    name: row.name,
    slug: row.slug,
    country: row.country,
    region: row.region,
    description: row.description,
    createdAt: new Date(row.created_at),
    updatedAt: new Date(row.updated_at),
  };
}
