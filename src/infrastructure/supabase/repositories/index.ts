import type { SupabaseClient } from "@supabase/supabase-js";
import type { Database } from "@/types/database.types";
import type { RecipeRepository } from "@/domain/ports";
import type { IngredientRepository } from "@/domain/ports";
import type { CuisineRepository } from "@/domain/ports";
import type { PantryRepository } from "@/domain/ports";
import type { FavoriteRepository } from "@/domain/ports";
import type { UserRepository } from "@/domain/ports";
import type { RecipeRecommendationCatalog } from "@/application/ports/recipe-recommendation";
import { createSupabaseRecipeRepository } from "./supabase-recipe-repository";
import { createSupabaseIngredientRepository } from "./supabase-ingredient-repository";
import { createSupabaseCuisineRepository } from "./supabase-cuisine-repository";
import { createSupabasePantryRepository } from "./supabase-pantry-repository";
import { createSupabaseFavoriteRepository } from "./supabase-favorite-repository";
import { createSupabaseUserRepository } from "./supabase-user-repository";
import { createSupabaseRecipeRecommendationCatalog } from "./supabase-recipe-recommendation-catalog";
import { toRepositoryError } from "./repository-error";

export { toRepositoryError };

/**
 * Clientes Supabase requeridos por los repositorios.
 *
 * El cliente `client` sirve para lecturas/escrituras con RLS activo (frontend
 * y casos de uso en general). `adminClient` permite acceder a Auth Admin y
 * realizar operaciones privilegiadas cuando sea necesario (p. ej. búsquedas por
 * email, borrados masivos).
 */
export interface SupabaseRepositoryClients {
  client: SupabaseClient<Database>;
  adminClient?: SupabaseClient<Database>;
}

/**
 * Grupo de repositorios concretos para inyectar en la composición raíz.
 */
export interface SupabaseRepositories {
  recipes: RecipeRepository;
  ingredients: IngredientRepository;
  cuisines: CuisineRepository;
  pantry: PantryRepository;
  favorites: FavoriteRepository;
  users: UserRepository;
  recommendationCatalog: RecipeRecommendationCatalog;
}

/**
 * Crea un único entry point que expone todos los repositorios Supabase.
 *
 * Este es el punto de inyección simple que consume la composition root
 * (spec 02/07). El repositorio de usuarios usa `adminClient` si está
 * disponible, de lo contrario recurre a `client`.
 */
export function createSupabaseRepositories(
  clients: SupabaseRepositoryClients,
): SupabaseRepositories {
  const adminClient = clients.adminClient ?? clients.client;

  return {
    recipes: createSupabaseRecipeRepository(clients.client),
    ingredients: createSupabaseIngredientRepository(clients.client),
    cuisines: createSupabaseCuisineRepository(clients.client),
    pantry: createSupabasePantryRepository(clients.client),
    favorites: createSupabaseFavoriteRepository(clients.client),
    users: createSupabaseUserRepository(adminClient),
    recommendationCatalog: createSupabaseRecipeRecommendationCatalog(
      clients.client,
    ),
  };
}

export { createSupabaseRecipeRepository } from "./supabase-recipe-repository";
export { createSupabaseIngredientRepository } from "./supabase-ingredient-repository";
export { createSupabaseCuisineRepository } from "./supabase-cuisine-repository";
export { createSupabasePantryRepository } from "./supabase-pantry-repository";
export { createSupabaseFavoriteRepository } from "./supabase-favorite-repository";
export { createSupabaseUserRepository } from "./supabase-user-repository";
export { createSupabaseRecipeRecommendationCatalog } from "./supabase-recipe-recommendation-catalog";
