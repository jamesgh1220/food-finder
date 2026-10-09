import { describe, expect, it } from "vitest";
import { RepositoryError } from "@/domain/errors";
import { Quantity, Unit } from "@/domain/value-objects";
import type { Tables } from "@/types/database.types";
import {
  toCuisine,
  toFavoriteRecipe,
  toFavoriteRecipeWrite,
  toIngredient,
  toIngredientWrite,
  toPantryItem,
  toPantryItemWrite,
  toRecipe,
  toUser,
} from "@/infrastructure/supabase/mappers";

/** Fila base de `recipes`; cada test sobrescribe solo lo que necesita. */
const recipeRow: Tables<"recipes"> = {
  id: "recipe-1",
  name: "Tortilla de patatas",
  slug: "tortilla-de-patatas",
  description: "Clásico español",
  cuisine_id: "cuisine-1",
  country: "España",
  region: null,
  meal_type: "LUNCH",
  instructions: "Pela, corta y fríe.",
  preparation_time: 15,
  cooking_time: 20,
  servings: 4,
  difficulty: "EASY",
  image_url: null,
  source: "INTERNAL",
  source_url: null,
  created_at: "2026-01-01T00:00:00.000Z",
  updated_at: "2026-01-02T00:00:00.000Z",
};

describe("toRecipe", () => {
  it("convierte snake_case a camelCase y los timestamps a Date", () => {
    const recipe = toRecipe(recipeRow);

    expect(recipe.cuisineId).toBe("cuisine-1");
    expect(recipe.mealType).toBe("LUNCH");
    expect(recipe.preparationTime).toBe(15);
    expect(recipe.cookingTime).toBe(20);
    expect(recipe.difficulty).toBe("EASY");
    expect(recipe.source).toBe("INTERNAL");
    expect(recipe.createdAt).toBeInstanceOf(Date);
    expect(recipe.createdAt.toISOString()).toBe("2026-01-01T00:00:00.000Z");
    expect(recipe.updatedAt.toISOString()).toBe("2026-01-02T00:00:00.000Z");
  });

  it("aplica valores neutros a meal_type, source, instructions, preparation_time y servings nulos", () => {
    const recipe = toRecipe({
      ...recipeRow,
      meal_type: null,
      source: null,
      instructions: null,
      preparation_time: null,
      servings: null,
    });

    expect(recipe.mealType).toBe("ANY");
    expect(recipe.source).toBe("OTHER");
    expect(recipe.instructions).toBe("");
    expect(recipe.preparationTime).toBe(0);
    expect(recipe.servings).toBe(1);
  });

  it("rechaza meal_type desconocido cayendo a ANY", () => {
    const recipe = toRecipe({ ...recipeRow, meal_type: "BRUNCH" });
    expect(recipe.mealType).toBe("ANY");
  });

  it("convierte difficulty inválida a null", () => {
    const recipe = toRecipe({ ...recipeRow, difficulty: "EXPERT" });
    expect(recipe.difficulty).toBeNull();
  });

  it("acepta difficulty null", () => {
    const recipe = toRecipe({ ...recipeRow, difficulty: null });
    expect(recipe.difficulty).toBeNull();
  });

  it("lanza RepositoryError si cuisine_id es null", () => {
    expect(() => toRecipe({ ...recipeRow, cuisine_id: null })).toThrow(
      RepositoryError,
    );

    try {
      toRecipe({ ...recipeRow, cuisine_id: null });
    } catch (error) {
      expect(error).toBeInstanceOf(RepositoryError);
      expect((error as RepositoryError).code).toBe("REPOSITORY_ERROR");
    }
  });
});

describe("toIngredient", () => {
  const ingredientRow: Tables<"ingredients"> = {
    id: "ingredient-1",
    name: "Tomate",
    normalized_name: "tomate",
    category: "Verdura",
    is_pantry_staple: true,
    created_at: "2026-01-01T00:00:00.000Z",
    updated_at: "2026-01-02T00:00:00.000Z",
  };

  it("convierte snake_case a camelCase", () => {
    const ingredient = toIngredient(ingredientRow);

    expect(ingredient).toEqual({
      id: "ingredient-1",
      name: "Tomate",
      normalizedName: "tomate",
      category: "Verdura",
      isPantryStaple: true,
      createdAt: new Date("2026-01-01T00:00:00.000Z"),
      updatedAt: new Date("2026-01-02T00:00:00.000Z"),
    });
  });

  it("normaliza is_pantry_staple null a false", () => {
    const ingredient = toIngredient({
      ...ingredientRow,
      is_pantry_staple: null,
    });
    expect(ingredient.isPantryStaple).toBe(false);
  });

  it("toIngredientWrite produce las claves snake_case con ISO strings", () => {
    const write = toIngredientWrite(toIngredient(ingredientRow));

    expect(write).toEqual({
      id: "ingredient-1",
      name: "Tomate",
      normalized_name: "tomate",
      category: "Verdura",
      is_pantry_staple: true,
      created_at: "2026-01-01T00:00:00.000Z",
      updated_at: "2026-01-02T00:00:00.000Z",
    });
  });
});

describe("toCuisine", () => {
  it("convierte snake_case a camelCase", () => {
    const row: Tables<"cuisines"> = {
      id: "cuisine-1",
      name: "Mediterránea",
      slug: "mediterranea",
      country: "España",
      region: "Europa",
      description: null,
      created_at: "2026-01-01T00:00:00.000Z",
      updated_at: "2026-01-02T00:00:00.000Z",
    };

    expect(toCuisine(row)).toEqual({
      id: "cuisine-1",
      name: "Mediterránea",
      slug: "mediterranea",
      country: "España",
      region: "Europa",
      description: null,
      createdAt: new Date("2026-01-01T00:00:00.000Z"),
      updatedAt: new Date("2026-01-02T00:00:00.000Z"),
    });
  });
});

describe("toPantryItem", () => {
  const row: Tables<"pantry_items"> = {
    id: "pantry-1",
    user_id: "user-1",
    ingredient_id: "ingredient-1",
    quantity: 2,
    unit: "kg",
    created_at: "2026-01-01T00:00:00.000Z",
    updated_at: "2026-01-02T00:00:00.000Z",
  };

  it("convierte quantity/unit en value objects", () => {
    const item = toPantryItem(row);

    expect(item.quantity.equals(Quantity.create(2))).toBe(true);
    expect(item.unit.equals(Unit.create("kg"))).toBe(true);
    expect(item.userId).toBe("user-1");
    expect(item.ingredientId).toBe("ingredient-1");
  });

  it("normaliza quantity/unit null a Quantity(0) y Unit(\"unit\")", () => {
    const item = toPantryItem({ ...row, quantity: null, unit: null });

    expect(item.quantity.equals(Quantity.create(0))).toBe(true);
    expect(item.unit.equals(Unit.create("unit"))).toBe(true);
  });

  it("toPantryItemWrite omite id y timestamps", () => {
    const write = toPantryItemWrite(toPantryItem(row));

    expect(write).toEqual({
      user_id: "user-1",
      ingredient_id: "ingredient-1",
      quantity: 2,
      unit: "kg",
    });
    expect(write).not.toHaveProperty("id");
    expect(write).not.toHaveProperty("created_at");
    expect(write).not.toHaveProperty("updated_at");
  });
});

describe("toFavoriteRecipe", () => {
  const row: Tables<"favorite_recipes"> = {
    id: "favorite-1",
    user_id: "user-1",
    recipe_id: "recipe-1",
    created_at: "2026-01-01T00:00:00.000Z",
  };

  it("convierte snake_case a camelCase", () => {
    expect(toFavoriteRecipe(row)).toEqual({
      userId: "user-1",
      recipeId: "recipe-1",
      createdAt: new Date("2026-01-01T00:00:00.000Z"),
    });
  });

  it("toFavoriteRecipeWrite produce solo user_id y recipe_id", () => {
    const write = toFavoriteRecipeWrite(toFavoriteRecipe(row));

    expect(write).toEqual({
      user_id: "user-1",
      recipe_id: "recipe-1",
    });
  });
});

describe("toUser", () => {
  it("convierte created_at a Date y conserva el email", () => {
    const user = toUser({
      id: "user-1",
      email: "user@test.dev",
      created_at: "2026-01-01T00:00:00.000Z",
    });

    expect(user).toEqual({
      id: "user-1",
      email: "user@test.dev",
      createdAt: new Date("2026-01-01T00:00:00.000Z"),
    });
  });

  it("usa cadena vacía cuando el email es null o ausente", () => {
    expect(toUser({ id: "user-1", email: null, created_at: "2026-01-01T00:00:00.000Z" }).email).toBe("");
    expect(toUser({ id: "user-1", created_at: "2026-01-01T00:00:00.000Z" }).email).toBe("");
  });
});
