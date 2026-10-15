import type { SupabaseClient } from "@supabase/supabase-js";
import type { IngredientRepository, RecipeRepository } from "@/domain/ports";
import type {
  RecipeIngredientDetail,
  RecipeIngredientInput,
} from "@/domain/entities";
import type { Logger } from "@/application/ports/logger";
import { normalizeIngredientName } from "@/domain/normalization/ingredient-normalizer";
import type { Database, TablesInsert } from "@/types/database.types";
import {
  toRecipe,
  toRecipeIngredientDetail,
  toRecipeRow,
  type RecipeIngredientRow,
} from "../mappers";
import { toRepositoryError } from "./repository-error";
import { createSupabaseIngredientRepository } from "./supabase-ingredient-repository";

/** Opciones del repositorio Supabase de recetas. */
export interface SupabaseRecipeRepositoryOptions {
  /**
   * Repositorio del catálogo global de ingredientes. Por defecto se construye
   * sobre el **mismo cliente**, que es justo lo que necesita el escritor
   * privilegiado: enlazar un ingrediente exige una fila de catálogo
   * (`recipe_ingredients.ingredient_id` es `NOT NULL REFERENCES`) y ni
   * `ingredients` ni `recipe_ingredients` admiten INSERT bajo RLS (spec 04,
   * REQ-04).
   */
  ingredients?: IngredientRepository;
  /**
   * Logger opcional. Solo se usa para reportar la degradación de ingredientes:
   * un fallo ahí no debe romper la persistencia de la receta, pero tampoco debe
   * ser invisible.
   */
  logger?: Logger;
}

/**
 * Repositorio Supabase de recetas (spec 06, REQ-08).
 *
 * Implementa el puerto `RecipeRepository` sobre Postgrest. Todos los fallos de
 * persistencia se normalizan con `toRepositoryError`.
 */
export function createSupabaseRecipeRepository(
  client: SupabaseClient<Database>,
  options: SupabaseRecipeRepositoryOptions = {},
): RecipeRepository {
  const ingredientRepository =
    options.ingredients ?? createSupabaseIngredientRepository(client);
  const { logger } = options;

  /**
   * Resuelve cada nombre contra el catálogo global y crea los que falten.
   *
   * Devuelve `nombre normalizado -> id`. **Nunca lanza**: la resolución es
   * degradable, porque perder la receta entera por un ingrediente es peor que
   * guardarla sin el detalle.
   */
  const resolveIngredientIds = async (
    inputs: RecipeIngredientInput[],
  ): Promise<Map<string, string>> => {
    const resolved = new Map<string, string>();

    // Un único nombre de display por valor normalizado: así no se consulta ni
    // se crea dos veces el mismo ingrediente.
    const displayNames = new Map<string, string>();
    for (const input of inputs) {
      const normalized = normalizeIngredientName(input.name);
      if (normalized.length === 0) {
        continue;
      }
      if (!displayNames.has(normalized)) {
        displayNames.set(normalized, input.name.trim());
      }
    }

    if (displayNames.size === 0) {
      return resolved;
    }

    try {
      // Una sola lectura para todos los nombres (no N+1).
      const existing = await ingredientRepository.findByNormalizedNames([
        ...displayNames.keys(),
      ]);
      for (const ingredient of existing) {
        resolved.set(ingredient.normalizedName, ingredient.id);
      }

      for (const [normalized, displayName] of displayNames) {
        if (resolved.has(normalized)) {
          continue;
        }
        const now = new Date();
        const created = await ingredientRepository.save({
          id: globalThis.crypto.randomUUID(),
          name: displayName,
          normalizedName: normalized,
          category: null,
          isPantryStaple: false,
          createdAt: now,
          updatedAt: now,
        });
        resolved.set(created.normalizedName, created.id);
      }
    } catch (error) {
      logger?.warn(
        "No se pudieron resolver los ingredientes de la receta generada.",
        { feature: "recipe-ingredients", reason: String(error) },
      );
      // Mapa vacío a propósito: sin ids no se escribe ninguna fila de join.
      return new Map();
    }

    return resolved;
  };

  /**
   * Escribe las filas de `recipe_ingredients`.
   *
   * Deduplica por `ingredient_id` (índice único `(recipe_id, ingredient_id)`) y
   * tampoco lanza: un fallo aquí degrada el detalle, nunca la receta.
   */
  const persistIngredients = async (
    recipeId: string,
    inputs: RecipeIngredientInput[],
    resolved: Map<string, string>,
  ): Promise<void> => {
    const seen = new Set<string>();
    const rows: TablesInsert<"recipe_ingredients">[] = [];

    for (const input of inputs) {
      const ingredientId = resolved.get(normalizeIngredientName(input.name));
      if (ingredientId === undefined || seen.has(ingredientId)) {
        continue;
      }
      seen.add(ingredientId);
      rows.push({
        recipe_id: recipeId,
        ingredient_id: ingredientId,
        quantity: input.quantity,
        unit: input.unit,
        optional: input.optional,
      });
    }

    if (rows.length === 0) {
      return;
    }

    try {
      const { error } = await client.from("recipe_ingredients").insert(rows);
      if (error) {
        throw toRepositoryError(
          "No se pudieron guardar los ingredientes de la receta.",
          error,
        );
      }
    } catch (error) {
      logger?.warn("No se pudieron guardar los ingredientes de la receta.", {
        feature: "recipe-ingredients",
        reason: String(error),
      });
    }
  };

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

    async save(recipe, ingredients) {
      // El catálogo se resuelve ANTES de insertar la receta: crear ingredientes
      // no depende de la receta y un fallo aquí no debe impedir guardarla.
      const resolved = await resolveIngredientIds(ingredients);

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

      const saved = toRecipe(data);

      // Solo con la receta ya persistida: nunca se escriben filas huérfanas.
      await persistIngredients(saved.id, ingredients, resolved);

      return saved;
    },
  };
}
