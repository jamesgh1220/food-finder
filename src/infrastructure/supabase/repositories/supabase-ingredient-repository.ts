import type { SupabaseClient } from "@supabase/supabase-js";
import type { IngredientRepository } from "@/domain/ports";
import type { Database } from "@/types/database.types";
import { toIngredient, toIngredientWrite } from "../mappers";
import { toRepositoryError } from "./repository-error";

/**
 * Repositorio Supabase de ingredientes (spec 06, REQ-08).
 *
 * Implementa el puerto `IngredientRepository` sobre Postgrest.
 */
export function createSupabaseIngredientRepository(
  client: SupabaseClient<Database>,
): IngredientRepository {
  return {
    async findById(id) {
      const { data, error } = await client
        .from("ingredients")
        .select("*")
        .eq("id", id)
        .maybeSingle();

      if (error) {
        throw toRepositoryError("No se pudo obtener el ingrediente.", error);
      }
      return data ? toIngredient(data) : null;
    },

    async findByNormalizedName(normalizedName) {
      // Usa el índice sobre `normalized_name` para la búsqueda exacta.
      const { data, error } = await client
        .from("ingredients")
        .select("*")
        .eq("normalized_name", normalizedName)
        .maybeSingle();

      if (error) {
        throw toRepositoryError("No se pudo obtener el ingrediente.", error);
      }
      return data ? toIngredient(data) : null;
    },

    async findMany(query) {
      const trimmed = query?.trim() ?? "";
      let builder = client.from("ingredients").select("*");

      if (trimmed.length > 0) {
        builder = builder.ilike("normalized_name", `%${trimmed}%`);
      }

      const { data, error } = await builder.order("name");

      if (error) {
        throw toRepositoryError("No se pudieron obtener los ingredientes.", error);
      }
      return (data ?? []).map(toIngredient);
    },

    async findByNormalizedNames(names) {
      // Sin nombres no se toca la base.
      if (names.length === 0) {
        return [];
      }

      const { data, error } = await client
        .from("ingredients")
        .select("*")
        .in("normalized_name", names);

      if (error) {
        throw toRepositoryError("No se pudieron obtener los ingredientes.", error);
      }
      return (data ?? []).map(toIngredient);
    },

    async save(ingredient) {
      // No hay UNIQUE sobre `normalized_name` (solo un índice), así que el
      // upsert se hace por PK (`id`). La deduplicación por nombre normalizado
      // es responsabilidad del caso de uso, no del repositorio.
      const { data, error } = await client
        .from("ingredients")
        .upsert(toIngredientWrite(ingredient), { onConflict: "id" })
        .select()
        .single();

      if (error) {
        throw toRepositoryError("No se pudo guardar el ingrediente.", error);
      }
      return toIngredient(data);
    },
  };
}
