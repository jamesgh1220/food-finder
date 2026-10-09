import { describe, expect, it, vi } from "vitest";
import type { PantryItem } from "@/domain/entities";
import type { User } from "@/domain/ports";
import { RepositoryError } from "@/domain/errors";
import { Quantity, Unit } from "@/domain/value-objects";
import {
  createSupabaseCuisineRepository,
  createSupabaseFavoriteRepository,
  createSupabaseIngredientRepository,
  createSupabasePantryRepository,
  createSupabaseRecipeRepository,
  createSupabaseUserRepository,
} from "@/infrastructure/supabase/repositories";
import { toUser } from "@/infrastructure/supabase/mappers";
import type { Tables } from "@/types/database.types";
import { createFakeSupabaseClient } from "./fake-supabase-client";

const NOW = "2026-01-01T00:00:00.000Z";

/**
 * Fila base para `recipes`. Solo sobrescribe lo necesario en los tests.
 */
const recipeRow: Tables<"recipes"> = {
  id: "recipe-1",
  name: "Tortilla",
  slug: "tortilla",
  description: null,
  cuisine_id: "cuisine-1",
  country: null,
  region: null,
  meal_type: "LUNCH",
  instructions: "Instrucciones",
  preparation_time: 10,
  cooking_time: 5,
  servings: 4,
  difficulty: "EASY",
  image_url: null,
  source: "INTERNAL",
  source_url: null,
  created_at: NOW,
  updated_at: NOW,
};

const ingredientRow: Tables<"ingredients"> = {
  id: "ingredient-1",
  name: "Tomate",
  normalized_name: "tomate",
  category: null,
  is_pantry_staple: false,
  created_at: NOW,
  updated_at: NOW,
};

const cuisineRow: Tables<"cuisines"> = {
  id: "cuisine-1",
  name: "Española",
  slug: "espanola",
  country: "ES",
  region: null,
  description: null,
  created_at: NOW,
  updated_at: NOW,
};

const pantryRow: Tables<"pantry_items"> = {
  id: "pantry-1",
  user_id: "user-1",
  ingredient_id: "ingredient-1",
  quantity: 2,
  unit: "kg",
  created_at: NOW,
  updated_at: NOW,
};

const favoriteRow: Tables<"favorite_recipes"> = {
  id: "favorite-1",
  user_id: "user-1",
  recipe_id: "recipe-1",
  created_at: NOW,
};

/**
 * Comprueba que `findByIds([])` no emite ninguna consulta a Supabase.
 */
describe("Supabase repositories", () => {
  it("findByIds([]) devuelve [] y no realiza ninguna consulta", async () => {
    const { client, calls } = createFakeSupabaseClient();
    const repo = createSupabaseRecipeRepository(client);
    const result = await repo.findByIds([]);
    expect(result).toEqual([]);
    expect(calls).toHaveLength(0);
  });

  it("findByIds([a,b]) emite UNA sola consulta con filtro in (no N+1)", async () => {
    const { client, calls } = createFakeSupabaseClient({
      response: { data: [recipeRow], error: null },
    });
    const repo = createSupabaseRecipeRepository(client);
    const result = await repo.findByIds(["recipe-1", "recipe-2"]);
    expect(result).toHaveLength(1);
    expect(calls.length).toBeGreaterThan(0);
    // Debe existir alguna llamada con método 'in'.
    const hasIn = calls.some(
      (c) => c.method === "in" && Array.isArray(c.args) && c.args[0] === "id",
    );
    expect(hasIn).toBe(true);
  });

  it("findMany({ cuisineId, mealType, search }) registra eq, ilike y order", async () => {
    const { client, calls } = createFakeSupabaseClient({
      response: { data: [recipeRow], error: null },
    });
    const repo = createSupabaseRecipeRepository(client);
    await repo.findMany({
      cuisineId: "cuisine-1",
      mealType: "LUNCH",
      search: "tort",
    });
    const methodNames = calls.map((c) => c.method);
    expect(methodNames).toContain("eq");
    expect(methodNames).toContain("ilike");
    expect(methodNames).toContain("order");
    // Debe haber eq para cuisine_id y meal_type.
    const eqArgs = calls.filter((c) => c.method === "eq").map((c) => c.args[0]);
    expect(eqArgs).toContain("cuisine_id");
    expect(eqArgs).toContain("meal_type");
    const ilikeCall = calls.find((c) => c.method === "ilike");
    expect(ilikeCall).toBeDefined();
    expect(ilikeCall?.args[0]).toBe("name");
  });

  it("pantry.upsert registra onConflict: 'user_id,ingredient_id' y devuelve PantryItem mapeado", async () => {
    const { client, calls } = createFakeSupabaseClient({
      response: { data: pantryRow, error: null },
    });
    const repo = createSupabasePantryRepository(client);
    const item: PantryItem = {
      id: pantryRow.id,
      userId: pantryRow.user_id,
      ingredientId: pantryRow.ingredient_id,
      quantity: Quantity.create(2),
      unit: Unit.create("kg"),
      createdAt: new Date(NOW),
      updatedAt: new Date(NOW),
    };
    const result = await repo.upsert(item);
    // Busca llamada upsert.
    const upsertCall = calls.find((c) => c.method === "upsert");
    expect(upsertCall).toBeDefined();
    expect(upsertCall?.args[1]).toEqual({ onConflict: "user_id,ingredient_id" });
    // Resultado mapeado correctamente.
    expect(result.userId).toBe("user-1");
    expect(result.ingredientId).toBe("ingredient-1");
    expect(result.quantity.equals(Quantity.create(2))).toBe(true);
    expect(result.unit.equals(Unit.create("kg"))).toBe(true);
  });

  it("favorite.add registra onConflict: 'user_id,recipe_id' + ignoreDuplicates: true", async () => {
    const { client, calls } = createFakeSupabaseClient({
      response: { data: favoriteRow, error: null },
    });
    const repo = createSupabaseFavoriteRepository(client);
    const result = await repo.add({
      userId: "user-1",
      recipeId: "recipe-1",
      createdAt: new Date(NOW),
    });
    const upsertCall = calls.find((c) => c.method === "upsert");
    expect(upsertCall).toBeDefined();
    expect(upsertCall?.args[1]).toEqual({
      onConflict: "user_id,recipe_id",
      ignoreDuplicates: true,
    });
    expect(result.recipeId).toBe("recipe-1");
  });

  it("recipe.findById envuelve error de Supabase en RepositoryError con mensaje español y código REPOSITORY_ERROR", async () => {
    const supabaseError = {
      message: "boom",
      code: "42P01",
      details: "relation does not exist",
    };
    const { client } = createFakeSupabaseClient({
      response: { data: null, error: supabaseError },
    });
    const repo = createSupabaseRecipeRepository(client);
    let caught: unknown;
    try {
      await repo.findById("id");
    } catch (e) {
      caught = e;
    }
    expect(caught).toBeInstanceOf(RepositoryError);
    expect((caught as RepositoryError).code).toBe("REPOSITORY_ERROR");
    // El mensaje no debe contener el mensaje crudo de Supabase.
    expect((caught as RepositoryError).message).not.toContain("boom");
  });

  it("user.findById resuelve admin.getUserById a User mapeado", async () => {
    const { client, authAdmin } = createFakeSupabaseClient({
      authAdmin: {
        getUserById: vi.fn(async () => ({
          data: {
            user: {
              id: "user-1",
              email: "user@test.dev",
              created_at: NOW,
            },
          },
          error: null,
        })),
        listUsers: async () => ({
          data: { users: [], aud: "test", page: 1, perPage: 1000, total: 0 },
          error: null,
        }),
      },
    });
    const repo = createSupabaseUserRepository(client);
    const result = await repo.findById("user-1");
    expect(authAdmin.getUserById).toHaveBeenCalledWith("user-1");
    const expected = toUser({ id: "user-1", email: "user@test.dev", created_at: NOW });
    expect(result).toEqual(expected);
  });

  it("user.findById retorna null si getUserById devuelve 404/not found", async () => {
    const { client } = createFakeSupabaseClient({
      authAdmin: {
        getUserById: async () => ({
          data: { user: null },
          error: { status: 404, message: "User not found" },
        }),
        listUsers: async () => ({
          data: { users: [], aud: "test", page: 1, perPage: 1000, total: 0 },
          error: null,
        }),
      },
    });
    const repo = createSupabaseUserRepository(client);
    const result = await repo.findById("missing");
    expect(result).toBeNull();
  });

  it("ingredient.save usa upsert con onConflict: 'id'", async () => {
    const { client, calls } = createFakeSupabaseClient({
      response: { data: ingredientRow, error: null },
    });
    const repo = createSupabaseIngredientRepository(client);
    await repo.save({
      id: ingredientRow.id,
      name: ingredientRow.name,
      normalizedName: ingredientRow.normalized_name,
      category: ingredientRow.category,
      isPantryStaple: false,
      createdAt: new Date(NOW),
      updatedAt: new Date(NOW),
    });
    const upsertCall = calls.find((c) => c.method === "upsert");
    expect(upsertCall).toBeDefined();
    expect(upsertCall?.args[1]).toEqual({ onConflict: "id" });
  });

  it("pantry.remove/clearByUser envuelven errores correctamente", async () => {
    const supabaseError = { message: "boom", code: "23503" };
    const { client } = createFakeSupabaseClient({
      response: { data: null, error: supabaseError },
    });
    const repo = createSupabasePantryRepository(client);
    let caught: unknown;
    try {
      await repo.remove("u", "i");
    } catch (e) {
      caught = e;
    }
    expect(caught).toBeInstanceOf(RepositoryError);
  });

  it("user.findByEmail paginación: encuentra email en primera página", async () => {
    const { client, authAdmin } = createFakeSupabaseClient({
      authAdmin: {
        getUserById: async () => ({ data: { user: null }, error: null }),
        listUsers: vi.fn(async () => ({
          data: {
            users: [
              { id: "u1", email: "a@test.com", created_at: NOW },
              { id: "u2", email: "b@test.com", created_at: NOW },
            ],
            aud: "test",
            page: 1,
            perPage: 1000,
            total: 2,
          },
          error: null,
        })),
      },
    });
    const repo = createSupabaseUserRepository(client);
    const result = await repo.findByEmail("b@test.com");
    expect(authAdmin.listUsers).toHaveBeenCalledWith({ page: 1, perPage: 1000 });
    expect(result).not.toBeNull();
    expect(result?.email).toBe("b@test.com");
  });

  it("user.findByEmail retorna null cuando no existe tras recorrer páginas", async () => {
    const { client } = createFakeSupabaseClient({
      authAdmin: {
        getUserById: async () => ({ data: { user: null }, error: null }),
        listUsers: async () => ({
          data: {
            users: [{ id: "u1", email: "a@test.com", created_at: NOW }],
            aud: "test",
            page: 1,
            perPage: 1000,
            total: 1,
          },
          error: null,
        }),
      },
    });
    const repo = createSupabaseUserRepository(client);
    const result = await repo.findByEmail("missing@test.com");
    expect(result).toBeNull();
  });

  it("user.save hace upsert en profiles por id y devuelve el usuario de entrada", async () => {
    const { client, calls } = createFakeSupabaseClient({
      response: { data: null, error: null },
    });
    const repo = createSupabaseUserRepository(client);
    const user: User = {
      id: "user-1",
      email: "user@test.dev",
      createdAt: new Date(NOW),
    };
    const result = await repo.save(user);
    const upsertCall = calls.find((c) => c.method === "upsert");
    expect(upsertCall).toBeDefined();
    expect(upsertCall?.args[0]).toEqual({ id: "user-1" });
    expect(upsertCall?.args[1]).toEqual({ onConflict: "id" });
    expect(result).toBe(user);
  });

  it("cuisine/ingredient/recipe: finders mapean resultados y envuelven errores", async () => {
    const { client } = createFakeSupabaseClient({
      response: { data: cuisineRow, error: null },
    });
    const cuisineRepo = createSupabaseCuisineRepository(client);
    const cuisine = await cuisineRepo.findById("c1");
    expect(cuisine?.name).toBe("Española");

    const { client: c2 } = createFakeSupabaseClient({
      response: { data: ingredientRow, error: null },
    });
    const ingRepo = createSupabaseIngredientRepository(c2);
    const ing = await ingRepo.findByNormalizedName("tomate");
    expect(ing?.name).toBe("Tomate");

    const { client: c3 } = createFakeSupabaseClient({
      response: { data: recipeRow, error: null },
    });
    const recRepo = createSupabaseRecipeRepository(c3);
    const rec = await recRepo.findBySlug("tortilla");
    expect(rec?.name).toBe("Tortilla");

    const { client: c4 } = createFakeSupabaseClient({
      response: { data: null, error: { message: "x", code: "999" } },
    });
    const ingRepo2 = createSupabaseIngredientRepository(c4);
    await expect(ingRepo2.findById("x")).rejects.toBeInstanceOf(RepositoryError);
  });

  it("favorite.exists/add/remove funcionan correctamente", async () => {
    const { client } = createFakeSupabaseClient({
      response: { data: { id: "fav1" }, error: null },
    });
    const favRepo = createSupabaseFavoriteRepository(client);
    const exists = await favRepo.exists("u", "r");
    expect(exists).toBe(true);

    const { client: c2 } = createFakeSupabaseClient({
      response: { data: favoriteRow, error: null },
    });
    const favRepo2 = createSupabaseFavoriteRepository(c2);
    const added = await favRepo2.add({
      userId: "u",
      recipeId: "r",
      createdAt: new Date(NOW),
    });
    expect(added.recipeId).toBe("recipe-1");

    const { client: c3 } = createFakeSupabaseClient({
      response: { data: null, error: null },
    });
    const favRepo3 = createSupabaseFavoriteRepository(c3);
    await favRepo3.remove("u", "r");
  });

  it("favorite.add devuelve entrada original cuando no hay data (duplicate ignored)", async () => {
    const { client } = createFakeSupabaseClient({
      response: { data: null, error: null },
    });
    const favRepo = createSupabaseFavoriteRepository(client);
    const fav = { userId: "u", recipeId: "r", createdAt: new Date(NOW) };
    const result = await favRepo.add(fav);
    expect(result).toBe(fav);
  });

  it("recipe.findMany con ids vacio en filtro devuelve [] sin consultas extra", async () => {
    const { client, calls } = createFakeSupabaseClient();
    const repo = createSupabaseRecipeRepository(client);
    const result = await repo.findMany({ ids: [] });
    expect(result).toEqual([]);
    expect(calls).toHaveLength(0);
  });

  it("user.findByEmail detiene al agotarse páginas (< perPage)", async () => {
    const { client, authAdmin } = createFakeSupabaseClient({
      authAdmin: {
        getUserById: async () => ({ data: { user: null }, error: null }),
        listUsers: vi.fn(async (params?: { page?: number }) => {
          const page = params?.page ?? 1;
          if (page === 1) {
            return {
              data: {
                users: [{ id: "u1", email: "a@test.com", created_at: NOW }],
                aud: "test",
                page: 1,
                perPage: 1000,
                total: 1,
              },
              error: null,
            };
          }
          return {
            data: {
              users: [],
              aud: "test",
              page,
              perPage: 1000,
              total: 1,
            },
            error: null,
          };
        }),
      },
    });
    const repo = createSupabaseUserRepository(client);
    const result = await repo.findByEmail("missing@test.com");
    expect(result).toBeNull();
    expect(authAdmin.listUsers).toHaveBeenCalledTimes(1);
  });

  it("user.findById envuelve error diferente a 404", async () => {
    const { client } = createFakeSupabaseClient({
      authAdmin: {
        getUserById: async () => ({
          data: { user: null },
          error: { status: 500, message: "Internal error" },
        }),
        listUsers: async () => ({
          data: { users: [], aud: "test", page: 1, perPage: 1000, total: 0 },
          error: null,
        }),
      },
    });
    const repo = createSupabaseUserRepository(client);
    await expect(repo.findById("x")).rejects.toBeInstanceOf(RepositoryError);
  });
});
