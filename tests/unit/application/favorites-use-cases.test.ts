import type { Mock } from "vitest";
import { describe, expect, it, vi } from "vitest";
import { AddFavoriteRecipe } from "@/application/favorites/add-favorite-recipe";
import { RemoveFavoriteRecipe } from "@/application/favorites/remove-favorite-recipe";
import { GetFavoriteRecipes } from "@/application/favorites/get-favorite-recipes";
import { ConflictError, NotFoundError, UnauthorizedError } from "@/domain/errors";
import type { FavoriteRepository, RecipeRepository } from "@/domain/ports";
import { createFakeAuthPort, makeRecipe, sessionUser } from "./helpers";

function createFakeFavorites(): FavoriteRepository {
  return {
    listByUser: vi.fn(async () => []),
    exists: vi.fn(async () => false),
    add: vi.fn(async (favorite) => favorite),
    remove: vi.fn(async () => {}),
  } satisfies FavoriteRepository;
}

function createFakeRecipes(): RecipeRepository {
  return {
    findById: vi.fn(async () => null),
    findBySlug: vi.fn(async () => null),
    findByIds: vi.fn(async () => []),
    findMany: vi.fn(async () => []),
  } satisfies RecipeRepository;
}

describe("AddFavoriteRecipe", () => {
  it("associates the favorite with the session user", async () => {
    const favorites = createFakeFavorites();
    const recipes = createFakeRecipes();
    (recipes.findById as Mock).mockResolvedValueOnce(makeRecipe());
    const useCase = new AddFavoriteRecipe(
      favorites,
      recipes,
      createFakeAuthPort(),
    );

    await useCase.execute({ recipeId: "recipe-1" });

    const added = (favorites.add as Mock).mock.calls[0][0];
    expect(added.userId).toBe(sessionUser.id);
    expect(added.recipeId).toBe("recipe-1");
  });

  it("throws NotFoundError when the recipe does not exist", async () => {
    const favorites = createFakeFavorites();
    const recipes = createFakeRecipes();
    const useCase = new AddFavoriteRecipe(
      favorites,
      recipes,
      createFakeAuthPort(),
    );

    await expect(
      useCase.execute({ recipeId: "missing" }),
    ).rejects.toBeInstanceOf(NotFoundError);
    expect(favorites.add).not.toHaveBeenCalled();
  });

  it("throws ConflictError when the recipe is already a favorite", async () => {
    const favorites = createFakeFavorites();
    const recipes = createFakeRecipes();
    (recipes.findById as Mock).mockResolvedValueOnce(makeRecipe());
    (favorites.exists as Mock).mockResolvedValueOnce(true);
    const useCase = new AddFavoriteRecipe(
      favorites,
      recipes,
      createFakeAuthPort(),
    );

    await expect(
      useCase.execute({ recipeId: "recipe-1" }),
    ).rejects.toBeInstanceOf(ConflictError);
    expect(favorites.exists).toHaveBeenCalledWith(sessionUser.id, "recipe-1");
    expect(favorites.add).not.toHaveBeenCalled();
  });
});

describe("RemoveFavoriteRecipe", () => {
  it("removes the favorite for the session user", async () => {
    const favorites = createFakeFavorites();
    const useCase = new RemoveFavoriteRecipe(favorites, createFakeAuthPort());

    await useCase.execute({ recipeId: "recipe-1" });

    expect(favorites.remove).toHaveBeenCalledWith(sessionUser.id, "recipe-1");
  });
});

describe("GetFavoriteRecipes", () => {
  it("resolves only the session user's favorites via listByUser + findByIds", async () => {
    const favorites = createFakeFavorites();
    const recipes = createFakeRecipes();
    (favorites.listByUser as Mock).mockResolvedValueOnce([
      { userId: sessionUser.id, recipeId: "recipe-1", createdAt: new Date() },
      { userId: sessionUser.id, recipeId: "recipe-2", createdAt: new Date() },
    ]);
    const recipeOne = makeRecipe({ id: "recipe-1" });
    const recipeTwo = makeRecipe({ id: "recipe-2" });
    (recipes.findByIds as Mock).mockResolvedValueOnce([recipeOne, recipeTwo]);
    const useCase = new GetFavoriteRecipes(
      favorites,
      recipes,
      createFakeAuthPort(),
    );

    const result = await useCase.execute();

    expect(favorites.listByUser).toHaveBeenCalledWith(sessionUser.id);
    expect(recipes.findByIds).toHaveBeenCalledWith(["recipe-1", "recipe-2"]);
    expect(result).toEqual([recipeOne, recipeTwo]);
  });

  it("returns [] and skips the catalog when there are no favorites", async () => {
    const favorites = createFakeFavorites();
    const recipes = createFakeRecipes();
    const useCase = new GetFavoriteRecipes(
      favorites,
      recipes,
      createFakeAuthPort(),
    );

    const result = await useCase.execute();

    expect(favorites.listByUser).toHaveBeenCalledWith(sessionUser.id);
    expect(recipes.findByIds).not.toHaveBeenCalled();
    expect(result).toEqual([]);
  });
});

describe("favorites — unauthorized", () => {
  it("every user-data use case throws and never touches its repositories", async () => {
    const favorites = createFakeFavorites();
    const recipes = createFakeRecipes();
    const noSession = createFakeAuthPort(null);

    await expect(
      new AddFavoriteRecipe(favorites, recipes, noSession).execute({
        recipeId: "recipe-1",
      }),
    ).rejects.toBeInstanceOf(UnauthorizedError);
    expect(recipes.findById).not.toHaveBeenCalled();
    expect(favorites.add).not.toHaveBeenCalled();

    await expect(
      new RemoveFavoriteRecipe(favorites, noSession).execute({
        recipeId: "recipe-1",
      }),
    ).rejects.toBeInstanceOf(UnauthorizedError);
    expect(favorites.remove).not.toHaveBeenCalled();

    await expect(
      new GetFavoriteRecipes(favorites, recipes, noSession).execute(),
    ).rejects.toBeInstanceOf(UnauthorizedError);
    expect(favorites.listByUser).not.toHaveBeenCalled();
  });
});