import { describe, it, expect, vi } from "vitest";
import type { NextRequest } from "next/server";
import type { ApplicationServices } from "@/lib/composition/application";
import type { Recipe } from "@/domain/entities";
import {
  ExternalServiceError,
  NotFoundError,
  UnauthorizedError,
} from "@/domain/errors";
import { listRecipes, getRecipe } from "@/lib/api/handlers/recipes";
import {
  listIngredients,
  searchIngredients,
} from "@/lib/api/handlers/ingredients";
import { listPantry } from "@/lib/api/handlers/pantry";
import { createRecommendation } from "@/lib/api/handlers/recommendations";
import { listCuisines } from "@/lib/api/handlers/cuisines";
import {
  addPantryItem,
  updatePantryItem,
  removePantryItem,
} from "@/lib/api/handlers/pantry";
import {
  listFavorites,
  addFavorite,
  removeFavorite,
} from "@/lib/api/handlers/favorites";

const VALID_UUID = "123e4567-e89b-12d3-a456-426614174000";

function createFakeRequest(url: string, body?: unknown): NextRequest {
  const init: RequestInit = body
    ? {
        method: "POST",
        body: JSON.stringify(body),
        headers: { "content-type": "application/json" },
      }
    : { method: "GET" };
  return new Request(url, init) as unknown as NextRequest;
}

const sampleRecipe: Recipe = {
  id: VALID_UUID,
  name: "Test",
  slug: "test",
  description: null,
  cuisineId: "c1",
  country: null,
  region: null,
  mealType: "LUNCH",
  instructions: "x",
  preparationTime: 10,
  cookingTime: null,
  servings: 2,
  difficulty: null,
  imageUrl: null,
  source: "INTERNAL",
  sourceUrl: null,
  createdAt: new Date("2020-01-01"),
  updatedAt: new Date("2020-01-01"),
};

function createFakeServices() {
  const pantryItem = (ingredientId: string, quantity: number, unit: string) => ({
    id: "p1",
    userId: "u1",
    ingredientId,
    quantity: { value: quantity },
    unit: { value: unit },
    createdAt: new Date("2020-01-01"),
    updatedAt: new Date("2020-01-01"),
  });

  return {
    searchRecipes: { execute: vi.fn(async () => [] as Recipe[]) },
    getRecipeById: { execute: vi.fn(async () => sampleRecipe) },
    searchIngredients: { execute: vi.fn(async () => []) },
    findRecipesFromPantry: { execute: vi.fn(async () => []) },
    getCuisines: { execute: vi.fn(async () => []) },
    getUserPantry: { execute: vi.fn(async () => []) },
    addPantryIngredient: {
      execute: vi.fn(async (i: { ingredientId: string; quantity: number; unit: string }) =>
        pantryItem(i.ingredientId, i.quantity, i.unit),
      ),
    },
    updatePantryIngredient: {
      execute: vi.fn(async (i: { ingredientId: string; quantity: number; unit: string }) =>
        pantryItem(i.ingredientId, i.quantity, i.unit),
      ),
    },
    removePantryIngredient: { execute: vi.fn(async () => undefined) },
    getFavoriteRecipes: { execute: vi.fn(async () => [] as Recipe[]) },
    addFavoriteRecipe: {
      execute: vi.fn(async () => ({
        userId: "u1",
        recipeId: VALID_UUID,
        createdAt: new Date("2020-01-01"),
      })),
    },
    removeFavoriteRecipe: { execute: vi.fn(async () => undefined) },
  } as unknown as ApplicationServices;
}

describe("handlers", () => {
  it("listRecipes returns success envelope", async () => {
    const services = createFakeServices();
    const res = await listRecipes(
      createFakeRequest("http://localhost/api/recipes"),
      services,
    );
    expect(res.status).toBe(200);
    expect((await res.json()).success).toBe(true);
  });

  it("getRecipe rejects a non-uuid param with 400", async () => {
    const res = await getRecipe({ id: "not-a-uuid" }, createFakeServices());
    expect(res.status).toBe(400);
    expect((await res.json()).error.code).toBe("VALIDATION_ERROR");
  });

  it("getRecipe returns the recipe for a valid uuid", async () => {
    const res = await getRecipe({ id: VALID_UUID }, createFakeServices());
    expect(res.status).toBe(200);
    expect((await res.json()).data.id).toBe(VALID_UUID);
  });

  it("listIngredients forwards the search query", async () => {
    const services = createFakeServices();
    await listIngredients(
      createFakeRequest("http://localhost/api/ingredients?search=tom"),
      services,
    );
    expect(services.searchIngredients.execute).toHaveBeenCalledWith({
      query: "tom",
    });
  });

  it("searchIngredients requires a query", async () => {
    const res = await searchIngredients(
      createFakeRequest("http://localhost/api/ingredients/search"),
      createFakeServices(),
    );
    expect(res.status).toBe(400);
  });

  it("createRecommendation accepts an empty ingredient list envelope", async () => {
    const res = await createRecommendation(
      createFakeRequest("http://localhost/api/recipes/recommendations", {
        ingredientIds: [],
      }),
      createFakeServices(),
    );
    expect(res.status).toBe(200);
    expect((await res.json()).success).toBe(true);
  });

  it("createRecommendation rejects a malformed ingredient id", async () => {
    const res = await createRecommendation(
      createFakeRequest("http://localhost/api/recipes/recommendations", {
        ingredientIds: ["bad"],
      }),
      createFakeServices(),
    );
    expect(res.status).toBe(400);
    expect((await res.json()).error.code).toBe("VALIDATION_ERROR");
  });

  it("listCuisines returns success", async () => {
    const res = await listCuisines(
      createFakeRequest("http://localhost/api/cuisines"),
      createFakeServices(),
    );
    expect(res.status).toBe(200);
  });

  it("addPantryItem returns 201 with a serialized item", async () => {
    const res = await addPantryItem(
      createFakeRequest("http://localhost/api/pantry", {
        ingredientId: VALID_UUID,
        quantity: 2,
        unit: "g",
      }),
      createFakeServices(),
    );
    expect(res.status).toBe(201);
    const body = await res.json();
    expect(body.success).toBe(true);
    expect(body.data.quantity).toBe(2);
    expect(body.data.unit).toBe("g");
  });

  it("updatePantryItem validates body and params", async () => {
    const res = await updatePantryItem(
      createFakeRequest("http://localhost/api/pantry/" + VALID_UUID, {
        ingredientId: VALID_UUID,
        quantity: 1,
        unit: "ml",
      }),
      createFakeServices(),
      { id: VALID_UUID },
    );
    expect(res.status).toBe(200);
  });

  it("removePantryItem returns success", async () => {
    const res = await removePantryItem(
      createFakeRequest("http://localhost/api/pantry/" + VALID_UUID),
      createFakeServices(),
      { id: VALID_UUID },
    );
    expect(res.status).toBe(200);
  });

  it("favorites add and remove work", async () => {
    const services = createFakeServices();
    const addRes = await addFavorite(
      createFakeRequest("http://localhost/api/favorites", {
        recipeId: VALID_UUID,
      }),
      services,
    );
    expect(addRes.status).toBe(201);
    const removeRes = await removeFavorite(
      createFakeRequest("http://localhost/api/favorites/" + VALID_UUID),
      services,
      { recipeId: VALID_UUID },
    );
    expect(removeRes.status).toBe(200);
  });

  it("listFavorites returns success", async () => {
    const res = await listFavorites(
      createFakeRequest("http://localhost/api/favorites"),
      createFakeServices(),
    );
    expect(res.status).toBe(200);
  });
  it("maps an unauthorized service error to 401", async () => {
    const services = createFakeServices();
    (services.getUserPantry.execute as ReturnType<typeof vi.fn>).mockRejectedValueOnce(
      new UnauthorizedError("No session"),
    );
    const res = await listPantry(
      createFakeRequest("http://localhost/api/pantry"),
      services,
    );
    expect(res.status).toBe(401);
    expect((await res.json()).error.code).toBe("UNAUTHORIZED");
  });

  it("maps a not-found service error to 404 without leaking internals", async () => {
    const services = createFakeServices();
    (services.getRecipeById.execute as ReturnType<typeof vi.fn>).mockRejectedValueOnce(
      new NotFoundError("Receta no encontrada"),
    );
    const res = await getRecipe({ id: VALID_UUID }, services);
    expect(res.status).toBe(404);
    const body = await res.json();
    expect(body.error.code).toBe("NOT_FOUND");
    expect(JSON.stringify(body)).not.toMatch(/stack|at /i);
  });

  it("maps an external provider error to 502", async () => {
    const services = createFakeServices();
    (services.findRecipesFromPantry.execute as ReturnType<typeof vi.fn>).mockRejectedValueOnce(
      new ExternalServiceError("Gemini caído"),
    );
    const res = await createRecommendation(
      createFakeRequest("http://localhost/api/recipes/recommendations", {
        ingredientIds: [],
      }),
      services,
    );
    expect(res.status).toBe(502);
    expect((await res.json()).error.code).toBe("EXTERNAL_SERVICE");
  });
});
