import { describe, expect, it } from "vitest";
import type {
  Cuisine,
  FavoriteRecipe,
  Ingredient,
  PantryItem,
  Recipe,
} from "@/domain/entities";
import type {
  CuisineRepository,
  FavoriteRepository,
  IngredientRepository,
  PantryRepository,
  RecipeFilter,
  RecipeRepository,
  User,
  UserRepository,
} from "@/domain/ports";
import { Quantity, Unit } from "@/domain/value-objects";

const NOW = new Date("2026-01-01T00:00:00.000Z");

function makeRecipe(overrides: Partial<Recipe> = {}): Recipe {
  return {
    id: "recipe-1",
    name: "Arepas",
    slug: "arepas",
    description: null,
    cuisineId: "cuisine-co",
    country: "CO",
    region: null,
    mealType: "BREAKFAST",
    instructions: "Mezclar y cocinar.",
    preparationTime: 10,
    cookingTime: 15,
    servings: 4,
    difficulty: "EASY",
    imageUrl: null,
    source: "INTERNAL",
    sourceUrl: null,
    createdAt: NOW,
    updatedAt: NOW,
    ...overrides,
  };
}

function makeIngredient(overrides: Partial<Ingredient> = {}): Ingredient {
  return {
    id: "ingredient-1",
    name: "Tomate",
    normalizedName: "tomate",
    category: null,
    isPantryStaple: false,
    createdAt: NOW,
    updatedAt: NOW,
    ...overrides,
  };
}

function makePantryItem(overrides: Partial<PantryItem> = {}): PantryItem {
  return {
    id: "pantry-1",
    userId: "user-1",
    ingredientId: "ingredient-1",
    quantity: Quantity.create(2),
    unit: Unit.create("unit"),
    createdAt: NOW,
    updatedAt: NOW,
    ...overrides,
  };
}

function makeCuisine(overrides: Partial<Cuisine> = {}): Cuisine {
  return {
    id: "cuisine-co",
    name: "Colombiana",
    slug: "colombiana",
    country: "CO",
    region: null,
    description: null,
    createdAt: NOW,
    updatedAt: NOW,
    ...overrides,
  };
}

/** Mock en memoria que implementa el puerto real (prueba de mockeabilidad). */
class InMemoryRecipeRepository implements RecipeRepository {
  constructor(private readonly recipes: Recipe[] = []) {}

  async findById(id: string): Promise<Recipe | null> {
    return this.recipes.find((recipe) => recipe.id === id) ?? null;
  }

  async findBySlug(slug: string): Promise<Recipe | null> {
    return this.recipes.find((recipe) => recipe.slug === slug) ?? null;
  }

  async findByIds(ids: string[]): Promise<Recipe[]> {
    return this.recipes.filter((recipe) => ids.includes(recipe.id));
  }

  async findMany(filter: RecipeFilter = {}): Promise<Recipe[]> {
    return this.recipes.filter((recipe) => {
      if (filter.cuisineId && recipe.cuisineId !== filter.cuisineId) return false;
      if (filter.mealType && recipe.mealType !== filter.mealType) return false;
      if (filter.ids && !filter.ids.includes(recipe.id)) return false;
      if (
        filter.search &&
        !recipe.name.toLowerCase().includes(filter.search.toLowerCase())
      ) {
        return false;
      }
      return true;
    });
  }
}

class InMemoryIngredientRepository implements IngredientRepository {
  constructor(private readonly ingredients: Ingredient[] = []) {}

  async findById(id: string): Promise<Ingredient | null> {
    return this.ingredients.find((item) => item.id === id) ?? null;
  }

  async findByNormalizedName(
    normalizedName: string,
  ): Promise<Ingredient | null> {
    return (
      this.ingredients.find((item) => item.normalizedName === normalizedName) ??
      null
    );
  }

  async findMany(query?: string): Promise<Ingredient[]> {
    if (!query) return [...this.ingredients];
    const needle = query.toLowerCase();
    return this.ingredients.filter((item) =>
      item.normalizedName.includes(needle),
    );
  }

  async findByNormalizedNames(names: string[]): Promise<Ingredient[]> {
    return this.ingredients.filter((item) =>
      names.includes(item.normalizedName),
    );
  }

  async save(ingredient: Ingredient): Promise<Ingredient> {
    const index = this.ingredients.findIndex((item) => item.id === ingredient.id);
    if (index >= 0) {
      this.ingredients[index] = ingredient;
    } else {
      this.ingredients.push(ingredient);
    }
    return ingredient;
  }
}

class InMemoryCuisineRepository implements CuisineRepository {
  constructor(private readonly cuisines: Cuisine[] = []) {}

  async findAll(): Promise<Cuisine[]> {
    return [...this.cuisines];
  }

  async findById(id: string): Promise<Cuisine | null> {
    return this.cuisines.find((cuisine) => cuisine.id === id) ?? null;
  }

  async findBySlug(slug: string): Promise<Cuisine | null> {
    return this.cuisines.find((cuisine) => cuisine.slug === slug) ?? null;
  }
}

class InMemoryPantryRepository implements PantryRepository {
  private readonly items: PantryItem[] = [];

  async listByUser(userId: string): Promise<PantryItem[]> {
    return this.items.filter((item) => item.userId === userId);
  }

  async findByUserAndIngredient(
    userId: string,
    ingredientId: string,
  ): Promise<PantryItem | null> {
    return (
      this.items.find(
        (item) =>
          item.userId === userId && item.ingredientId === ingredientId,
      ) ?? null
    );
  }

  async upsert(item: PantryItem): Promise<PantryItem> {
    const index = this.items.findIndex(
      (current) =>
        current.userId === item.userId &&
        current.ingredientId === item.ingredientId,
    );
    if (index >= 0) {
      this.items[index] = item;
    } else {
      this.items.push(item);
    }
    return item;
  }

  async remove(userId: string, ingredientId: string): Promise<void> {
    const index = this.items.findIndex(
      (item) => item.userId === userId && item.ingredientId === ingredientId,
    );
    if (index >= 0) {
      this.items.splice(index, 1);
    }
  }

  async clearByUser(userId: string): Promise<void> {
    for (let index = this.items.length - 1; index >= 0; index -= 1) {
      if (this.items[index].userId === userId) {
        this.items.splice(index, 1);
      }
    }
  }
}

class InMemoryFavoriteRepository implements FavoriteRepository {
  private readonly favorites: FavoriteRecipe[] = [];

  async listByUser(userId: string): Promise<FavoriteRecipe[]> {
    return this.favorites.filter((favorite) => favorite.userId === userId);
  }

  async exists(userId: string, recipeId: string): Promise<boolean> {
    return this.favorites.some(
      (favorite) =>
        favorite.userId === userId && favorite.recipeId === recipeId,
    );
  }

  async add(favorite: FavoriteRecipe): Promise<FavoriteRecipe> {
    const alreadyExists = await this.exists(
      favorite.userId,
      favorite.recipeId,
    );
    if (!alreadyExists) {
      this.favorites.push(favorite);
    }
    return favorite;
  }

  async remove(userId: string, recipeId: string): Promise<void> {
    const index = this.favorites.findIndex(
      (favorite) =>
        favorite.userId === userId && favorite.recipeId === recipeId,
    );
    if (index >= 0) {
      this.favorites.splice(index, 1);
    }
  }
}

class InMemoryUserRepository implements UserRepository {
  constructor(private readonly users: User[] = []) {}

  async findById(id: string): Promise<User | null> {
    return this.users.find((user) => user.id === id) ?? null;
  }

  async findByEmail(email: string): Promise<User | null> {
    return this.users.find((user) => user.email === email) ?? null;
  }

  async save(user: User): Promise<User> {
    const index = this.users.findIndex((current) => current.id === user.id);
    if (index >= 0) {
      this.users[index] = user;
    } else {
      this.users.push(user);
    }
    return user;
  }
}

describe("puertos de repositorio son mockeables", () => {
  it("RecipeRepository filtra por mealType", async () => {
    const repository: RecipeRepository = new InMemoryRecipeRepository([
      makeRecipe({ id: "r-1", slug: "arepas", mealType: "BREAKFAST" }),
      makeRecipe({ id: "r-2", slug: "cena", mealType: "DINNER" }),
    ]);

    const dinners = await repository.findMany({ mealType: "DINNER" });

    expect(dinners).toHaveLength(1);
    expect(dinners[0].id).toBe("r-2");
    expect(await repository.findByIds(["r-1", "r-2"])).toHaveLength(2);
    expect(await repository.findBySlug("arepas")).not.toBeNull();
  });

  it("PantryRepository permite agregar y listar", async () => {
    const repository: PantryRepository = new InMemoryPantryRepository();
    const item = makePantryItem();

    await repository.upsert(item);

    expect(await repository.listByUser("user-1")).toHaveLength(1);
    expect(
      await repository.findByUserAndIngredient("user-1", "ingredient-1"),
    ).not.toBeNull();

    await repository.remove("user-1", "ingredient-1");
    expect(await repository.listByUser("user-1")).toHaveLength(0);
  });

  it("FavoriteRepository permite agregar, consultar y eliminar", async () => {
    const repository: FavoriteRepository = new InMemoryFavoriteRepository();
    await repository.add({ userId: "user-1", recipeId: "r-1", createdAt: NOW });

    expect(await repository.exists("user-1", "r-1")).toBe(true);
    expect(await repository.listByUser("user-1")).toHaveLength(1);

    await repository.remove("user-1", "r-1");
    expect(await repository.exists("user-1", "r-1")).toBe(false);
  });

  it("IngredientRepository hace upsert y búsqueda por nombre normalizado", async () => {
    const repository: IngredientRepository = new InMemoryIngredientRepository();
    const ingredient = makeIngredient();

    await repository.save(ingredient);

    expect(await repository.findByNormalizedName("tomate")).not.toBeNull();
    expect(await repository.findByNormalizedNames(["tomate"])).toHaveLength(1);
    expect(await repository.findMany("tom")).toHaveLength(1);
  });

  it("CuisineRepository expone el catálogo", async () => {
    const repository: CuisineRepository = new InMemoryCuisineRepository([
      makeCuisine(),
    ]);

    expect(await repository.findAll()).toHaveLength(1);
    expect(await repository.findBySlug("colombiana")).not.toBeNull();
    expect(await repository.findById("cuisine-co")).not.toBeNull();
  });

  it("UserRepository guarda y busca", async () => {
    const repository: UserRepository = new InMemoryUserRepository();
    const user: User = { id: "user-1", email: "ana@example.com", createdAt: NOW };

    await repository.save(user);

    expect(await repository.findById("user-1")).not.toBeNull();
    expect(await repository.findByEmail("ana@example.com")).not.toBeNull();
  });
});
