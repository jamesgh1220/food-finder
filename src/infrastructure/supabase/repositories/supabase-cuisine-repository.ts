import type { SupabaseClient } from "@supabase/supabase-js";
import type { CuisineRepository } from "@/domain/ports";
import type { Database } from "@/types/database.types";
import { toCuisine } from "../mappers";
import { toRepositoryError } from "./repository-error";

/**
 * Repositorio Supabase del catálogo de cocinas (spec 06, REQ-08).
 *
 * Puerto de solo lectura: las cocinas se agregan con datos, no con código.
 */
export function createSupabaseCuisineRepository(
  client: SupabaseClient<Database>,
): CuisineRepository {
  return {
    async findAll() {
      const { data, error } = await client
        .from("cuisines")
        .select("*")
        .order("name");

      if (error) {
        throw toRepositoryError("No se pudieron obtener las cocinas.", error);
      }
      return (data ?? []).map(toCuisine);
    },

    async findById(id) {
      const { data, error } = await client
        .from("cuisines")
        .select("*")
        .eq("id", id)
        .maybeSingle();

      if (error) {
        throw toRepositoryError("No se pudo obtener la cocina.", error);
      }
      return data ? toCuisine(data) : null;
    },

    async findBySlug(slug) {
      const { data, error } = await client
        .from("cuisines")
        .select("*")
        .eq("slug", slug)
        .maybeSingle();

      if (error) {
        throw toRepositoryError("No se pudo obtener la cocina.", error);
      }
      return data ? toCuisine(data) : null;
    },
  };
}
