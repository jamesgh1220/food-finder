import type { SupabaseClient } from "@supabase/supabase-js";
import type { PantryRepository } from "@/domain/ports";
import type { Database } from "@/types/database.types";
import { toPantryItem, toPantryItemWrite } from "../mappers";
import { toRepositoryError } from "./repository-error";

/**
 * Repositorio Supabase de la despensa de un usuario (spec 06, REQ-08).
 *
 * Implementa el puerto `PantryRepository` sobre Postgrest.
 */
export function createSupabasePantryRepository(
  client: SupabaseClient<Database>,
): PantryRepository {
  return {
    async listByUser(userId) {
      const { data, error } = await client
        .from("pantry_items")
        .select("*")
        .eq("user_id", userId)
        .order("created_at", { ascending: true });

      if (error) {
        throw toRepositoryError("No se pudo obtener la despensa.", error);
      }
      return (data ?? []).map(toPantryItem);
    },

    async findByUserAndIngredient(userId, ingredientId) {
      const { data, error } = await client
        .from("pantry_items")
        .select("*")
        .eq("user_id", userId)
        .eq("ingredient_id", ingredientId)
        .maybeSingle();

      if (error) {
        throw toRepositoryError("No se pudo obtener el ingrediente.", error);
      }
      return data ? toPantryItem(data) : null;
    },

    async upsert(item) {
      // El mapeador de escritura omite a propósito `id` y timestamps: el upsert
      // sobre `(user_id, ingredient_id)` conserva el id existente y deja que el
      // trigger de `updated_at` actúe.
      const { data, error } = await client
        .from("pantry_items")
        .upsert(toPantryItemWrite(item), {
          onConflict: "user_id,ingredient_id",
        })
        .select()
        .single();

      if (error) {
        throw toRepositoryError("No se pudo guardar el ingrediente.", error);
      }
      return toPantryItem(data);
    },

    async remove(userId, ingredientId) {
      const { error } = await client
        .from("pantry_items")
        .delete()
        .eq("user_id", userId)
        .eq("ingredient_id", ingredientId);

      if (error) {
        throw toRepositoryError("No se pudo eliminar el ingrediente.", error);
      }
    },

    async clearByUser(userId) {
      const { error } = await client
        .from("pantry_items")
        .delete()
        .eq("user_id", userId);

      if (error) {
        throw toRepositoryError("No se pudo vaciar la despensa.", error);
      }
    },
  };
}
