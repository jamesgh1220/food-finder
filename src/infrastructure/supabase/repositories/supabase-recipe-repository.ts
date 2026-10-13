import type { SupabaseClient } from "@supabase/supabase-js";
import type { RecipeRepository } from "@/domain/ports";
import type { RecipeIngredientDetail } from "@/domain/entities";
import type { Database } from "@/types/database.types";
import {
  toRecipe,
  toRecipeIngredientDetail,
  toRecipeRow,
  type RecipeIngredientRow,
} from "../mappers";
import { toRepositoryError } from "./repository-error";

/**
 * Repositorio Supabase de recetas (spec 06, REQ-08).
 *
 * Implementa el puerto `RecipeRepository` sobre Postgrest. Todos los fallos de
 * persistencia se normalizan con `toRepositoryError`.
 */
export function createSupabaseRecipeRepository(
  client: SupabaseClient<Database>,
): RecipeRepository {
  return {
    async findById(id) {
      const { data, error } = await client
        .from("recipes")
        .select("*")
        .eq("id", id)
        .maybeSingle();

      if (error) {
        throw toRepositoryError("No se pudo obtener la receta.", error);
      }
      return data ? toRecipe(data) : null;
    },

    async findBySlug(slug) {
      const { data, error } = await client
        .from("recipes")
        .select("*")
        .eq("slug", slug)
        .maybeSingle();

      if (error) {
        throw toRepositoryError("No se pudo obtener la receta.", error);
      }
      return data ? toRecipe(data) : null;
    },

    async findByIds(ids) {
      // Sin IDs no se toca la base: se evita una consulta inútil.
      if (ids.length === 0) {
        return [];
      }

      // Una sola query con `in` resuelve todos los IDs (no N+1).
      const { data, error } = await client
        .from("recipes")
        .select("*")
        .in("id", ids);

      if (error) {
        throw toRepositoryError("No se pudieron obtener las recetas.", error);
      }
      return (data ?? []).map(toRecipe);
    },

    async findMany(filter = {}) {
      // Un filtro `ids` vacío no debe degenerar en "traer todo el catálogo":
      // se corta antes de construir la consulta (ni siquiera se toca el cliente).
      if (filter.ids !== undefined && filter.ids.length === 0) {
        return [];
      }

      // Cadena única y reasignable: cada filtro devuelve el mismo builder.
      let query = client.from("recipes").select("*");

      if (filter.cuisineId) {
        query = query.eq("cuisine_id", filter.cuisineId);
      }
      if (filter.mealType) {
        query = query.eq("meal_type", filter.mealType);
      }
      if (filter.ids !== undefined) {
        query = query.in("id", filter.ids);
      }
      if (filter.search) {
        query = query.ilike("name", `%${filter.search}%`);
      }

      const { data, error } = await query.order("name", { ascending: true });

      if (error) {
        throw toRepositoryError("No se pudieron obtener las recetas.", error);
      }
      return (data ?? []).map(toRecipe);
    },

    async findIngredients(recipeId) {
      // El embed `ingredients(id, name)` resuelve el nombre en una sola query
      // (sin N+1) y el orden por `created_at` mantiene estable la lista.
      const { data, error } = await client
        .from("recipe_ingredients")
        .select(
          "ingredient_id, quantity, unit, optional, notes, ingredients(id, name)",
        )
        .eq("recipe_id", recipeId)
        .order("created_at", { ascending: true });

      if (error) {
        throw toRepositoryError(
          "No se pudieron obtener los ingredientes de la receta.",
          error,
        );
      }

      return ((data ?? []) as unknown as RecipeIngredientRow[])
        .map(toRecipeIngredientDetail)
        .filter((detail): detail is RecipeIngredientDetail => detail !== null);
    },

    async save(recipe) {
      // Inserción pura: la base asigna id/created_at/updated_at. Sin `upsert`
      // para que una colisión de slug falle y no sobrescriba otra receta.
      const { data, error } = await client
        .from("recipes")
        .insert(toRecipeRow(recipe))
        .select()
        .single();

      if (error) {
        throw toRepositoryError("No se pudo guardar la receta.", error);
      }
      return toRecipe(data);
    },
  };
}
