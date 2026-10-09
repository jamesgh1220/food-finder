import type { SupabaseClient } from "@supabase/supabase-js";
import type { FavoriteRepository } from "@/domain/ports";
import type { Database } from "@/types/database.types";
import { toFavoriteRecipe, toFavoriteRecipeWrite } from "../mappers";
import { toRepositoryError } from "./repository-error";

/**
 * Repositorio Supabase de recetas favoritas (spec 06, REQ-08).
 *
 * Implementa el puerto `FavoriteRepository` sobre Postgrest.
 */
export function createSupabaseFavoriteRepository(
  client: SupabaseClient<Database>,
): FavoriteRepository {
  return {
    async listByUser(userId) {
      const { data, error } = await client
        .from("favorite_recipes")
        .select("*")
        .eq("user_id", userId)
        .order("created_at", { ascending: false });

      if (error) {
        throw toRepositoryError("No se pudieron obtener los favoritos.", error);
      }
      return (data ?? []).map(toFavoriteRecipe);
    },

    async exists(userId, recipeId) {
      const { data, error } = await client
        .from("favorite_recipes")
        .select("id")
        .eq("user_id", userId)
        .eq("recipe_id", recipeId)
        .maybeSingle();

      if (error) {
        throw toRepositoryError("No se pudo comprobar el favorito.", error);
      }
      return data !== null;
    },

    async add(favorite) {
      // Upsert idempotente: si el favorito ya existe la base lo ignora, así que
      // cuando no hay fila devolvemos la entrada original para no romper la
      // operación repetible.
      const { data, error } = await client
        .from("favorite_recipes")
        .upsert(toFavoriteRecipeWrite(favorite), {
          onConflict: "user_id,recipe_id",
          ignoreDuplicates: true,
        })
        .select()
        .maybeSingle();

      if (error) {
        throw toRepositoryError("No se pudo guardar el favorito.", error);
      }
      return data ? toFavoriteRecipe(data) : favorite;
    },

    async remove(userId, recipeId) {
      const { error } = await client
        .from("favorite_recipes")
        .delete()
        .eq("user_id", userId)
        .eq("recipe_id", recipeId);

      if (error) {
        throw toRepositoryError("No se pudo eliminar el favorito.", error);
      }
    },
  };
}
