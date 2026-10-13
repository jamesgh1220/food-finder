import { render, screen } from "@testing-library/react";
import { Suspense } from "react";
import { beforeEach, describe, expect, it, vi } from "vitest";
import RecipeDetailPage from "@/app/dashboard/recipes/[id]/page";
import type { RecommendedRecipe } from "@/application/ports/recipe-recommendation";
import type { Cuisine, PantryItem, RecipeIngredientDetail } from "@/domain/entities";
import { NotFoundError, UnauthorizedError } from "@/domain/errors";
import {
  difficultyLabels,
  messages,
  recipeSourceLabels,
} from "@/lib/i18n/messages";
import { Quantity, RecipeMatchScore, Unit } from "@/domain/value-objects";
import { makeRecipe } from "./test-helpers";

/**
 * Recipe detail page (spec 14, REQ-02/REQ-05/REQ-07/REQ-08/REQ-09/REQ-10;
 * PROMTP #43/#71/#72).
 *
 * `RecipeDetailPage` is a Server Component: it awaits `params`, resolves the
 * session, the recipe, its ingredients, the cuisine, the favorite state and the
 * recommendation match through the use cases (hop rule, spec 02). The tests mock
 * the server composition and the favorites Server Actions (the page renders
 * `FavoriteToggle`, which imports `next/cache`), then resolve the async content
 * child the page wraps in `<Suspense>`.
 */

const NOW = new Date("2026-01-01T00:00:00.000Z");

const mocks = vi.hoisted(() => ({
  createServerApplicationServices: vi.fn(),
  createServerAuthServices: vi.fn(),
  redirect: vi.fn(),
  authExecute: vi.fn(),
  getRecipeByIdExecute: vi.fn(),
  getRecipeIngredientsExecute: vi.fn(),
  getCuisineByIdExecute: vi.fn(),
  getFavoriteRecipesExecute: vi.fn(),
  getUserPantryExecute: vi.fn(),
  findRecipesExecute: vi.fn(),
  addFavoriteAction: vi.fn(),
  removeFavoriteAction: vi.fn(),
}));

vi.mock("@/lib/composition/server-application", () => ({
  createServerApplicationServices: mocks.createServerApplicationServices,
}));

vi.mock("@/lib/composition/server-auth", () => ({
  createServerAuthServices: mocks.createServerAuthServices,
}));

vi.mock("@/app/dashboard/favorites/actions", () => ({
  addFavoriteAction: mocks.addFavoriteAction,
  removeFavoriteAction: mocks.removeFavoriteAction,
}));

vi.mock("next/navigation", () => ({
  redirect: mocks.redirect,
  useRouter: () => ({
    replace: vi.fn(),
    push: vi.fn(),
    refresh: vi.fn(),
    prefetch: vi.fn(),
    back: vi.fn(),
    forward: vi.fn(),
  }),
  usePathname: () => "/dashboard/recipes/recipe-1",
  useSearchParams: () => new URLSearchParams(),
}));

vi.mock("next/image", async () => {
  const { MockImage } = await import("./test-helpers");
  return { default: MockImage };
});

vi.mock("next/link", async () => {
  const { MockLink } = await import("./test-helpers");
  return { default: MockLink };
});

const sessionUser = { id: "user-1", email: "ana@example.com" };

const RECIPE = makeRecipe({
  id: "recipe-1",
  name: "Tortilla de patatas",
  description: "Una receta sencilla y reconfortante.",
  cuisineId: "italiana",
  country: "España",
  region: "Cataluña",
  mealType: "LUNCH",
  instructions: "1. Batir los huevos.\n2. Freír las patatas.",
  preparationTime: 20,
  cookingTime: 10,
  servings: 4,
  difficulty: "EASY",
  source: "INTERNAL",
  imageUrl: null,
});

function makeCuisine(id: string, name: string): Cuisine {
  return {
    id,
    name,
    slug: id,
    country: null,
    region: null,
    description: null,
    createdAt: NOW,
    updatedAt: NOW,
  };
}

function makePantryItem(ingredientId: string): PantryItem {
  return {
    id: `pantry-${ingredientId}`,
    userId: sessionUser.id,
    ingredientId,
    quantity: Quantity.create(3),
    unit: Unit.create("unidades"),
    createdAt: NOW,
    updatedAt: NOW,
  };
}

function makeIngredientDetail(
  overrides: Partial<RecipeIngredientDetail> = {},
): RecipeIngredientDetail {
  return {
    ingredientId: "ing-tomate",
    name: "Tomate",
    quantity: 2,
    unit: "unidades",
    optional: false,
    notes: null,
    ...overrides,
  };
}

function makeRecommendation(
  overrides: Partial<RecommendedRecipe> = {},
): RecommendedRecipe {
  return {
    recipe: RECIPE,
    matchScore: RecipeMatchScore.create(0.92),
    availableIngredients: ["Tomate"],
    missingIngredients: ["Huevo"],
    optionalMissingIngredients: ["Albahaca"],
    ...overrides,
  };
}

/**
 * Resolves the async content element the page wraps in `<Suspense>` and renders
 * it, so the real server-side data flow runs against the mocked services.
 */
async function renderDetail(id = "recipe-1") {
  const page = RecipeDetailPage({
    params: Promise.resolve({ id }),
    searchParams: Promise.resolve({}),
  });

  const content = page.props.children as {
    type: (props: unknown) => Promise<React.ReactElement>;
    props: unknown;
  };
  const resolved = await content.type(content.props);

  return render(<Suspense fallback={null}>{resolved}</Suspense>);
}

beforeEach(() => {
  vi.clearAllMocks();
  mocks.redirect.mockImplementation((url: string) => {
    throw new Error(`redirect:${url}`);
  });
  mocks.addFavoriteAction.mockResolvedValue({ ok: true });
  mocks.removeFavoriteAction.mockResolvedValue({ ok: true });

  mocks.authExecute.mockResolvedValue({ ok: true, data: sessionUser });
  mocks.getRecipeByIdExecute.mockResolvedValue(RECIPE);
  mocks.getRecipeIngredientsExecute.mockResolvedValue([makeIngredientDetail()]);
  mocks.getCuisineByIdExecute.mockResolvedValue(makeCuisine("italiana", "Italiana"));
  mocks.getFavoriteRecipesExecute.mockResolvedValue([]);
  mocks.getUserPantryExecute.mockResolvedValue([makePantryItem("ing-tomate")]);
  mocks.findRecipesExecute.mockResolvedValue([makeRecommendation()]);

  mocks.createServerAuthServices.mockResolvedValue({
    getCurrentUser: { execute: mocks.authExecute },
  });
  mocks.createServerApplicationServices.mockResolvedValue({
    getRecipeById: { execute: mocks.getRecipeByIdExecute },
    getRecipeIngredients: { execute: mocks.getRecipeIngredientsExecute },
    getCuisineById: { execute: mocks.getCuisineByIdExecute },
    getFavoriteRecipes: { execute: mocks.getFavoriteRecipesExecute },
    getUserPantry: { execute: mocks.getUserPantryExecute },
    findRecipesFromPantry: { execute: mocks.findRecipesExecute },
  });
});

describe("RecipeDetailPage", () => {
  it("renders the recipe fields, ingredients and the percentage match block", async () => {
    await renderDetail();

    expect(
      await screen.findByRole("heading", { name: RECIPE.name }),
    ).toBeInTheDocument();
    expect(screen.getByText(RECIPE.description!)).toBeInTheDocument();
    expect(screen.getByText("Italiana")).toBeInTheDocument();
    expect(screen.getByText("España")).toBeInTheDocument();
    expect(screen.getByText("Cataluña")).toBeInTheDocument();
    expect(
      screen.getByText(messages.recipeDetail.minutes(30)),
    ).toBeInTheDocument();
    expect(
      screen.getByText(messages.recipeDetail.servingsValue(4)),
    ).toBeInTheDocument();
    // Difficulty and source appear both as header badges and meta rows.
    expect(screen.getAllByText(difficultyLabels.EASY).length).toBeGreaterThan(0);
    expect(
      screen.getAllByText(recipeSourceLabels.INTERNAL).length,
    ).toBeGreaterThan(0);
    // Ingredients with quantity/unit ("Tomate" is also an available chip).
    expect(screen.getAllByText("Tomate").length).toBeGreaterThan(0);
    expect(screen.getByText("2 unidades")).toBeInTheDocument();

    // REQ-05: the detail surfaces the percentage format.
    expect(
      screen.getByText(messages.recipeDetail.matchTitle),
    ).toBeInTheDocument();
    expect(
      screen.getByText(messages.matchScore.percentage(92)),
    ).toBeInTheDocument();
    expect(screen.getByText("Huevo")).toBeInTheDocument();
    expect(screen.getByText("Albahaca")).toBeInTheDocument();
  });

  it("runs the recommendation engine without meal-type or cuisine filters", async () => {
    await renderDetail();

    await screen.findByText(messages.recipeDetail.matchTitle);

    expect(mocks.findRecipesExecute).toHaveBeenCalledWith({
      ingredientIds: ["ing-tomate"],
    });
  });

  it("omits the match block when the recipe is absent from the recommendations (graceful degradation)", async () => {
    // The recipe is present in the catalog but not among the recommendations
    // (e.g. externally generated with no ingredient rows).
    mocks.findRecipesExecute.mockResolvedValue([]);

    await renderDetail();

    expect(
      await screen.findByRole("heading", { name: RECIPE.name }),
    ).toBeInTheDocument();
    expect(
      screen.queryByText(messages.recipeDetail.matchTitle),
    ).not.toBeInTheDocument();
    // The rest of the detail is intact.
    expect(
      screen.getAllByText(recipeSourceLabels.INTERNAL).length,
    ).toBeGreaterThan(0);
  });

  it("skips the match computation when the pantry is empty", async () => {
    mocks.getUserPantryExecute.mockResolvedValue([]);

    await renderDetail();

    await screen.findByRole("heading", { name: RECIPE.name });

    expect(mocks.findRecipesExecute).not.toHaveBeenCalled();
    expect(
      screen.queryByText(messages.recipeDetail.matchTitle),
    ).not.toBeInTheDocument();
  });

  it("shows the in-page not-found state when the recipe does not exist", async () => {
    mocks.getRecipeByIdExecute.mockRejectedValue(
      new NotFoundError("La receta no existe"),
    );

    await renderDetail("missing");

    expect(
      await screen.findByText(messages.recipeDetail.notFoundTitle),
    ).toBeInTheDocument();
    expect(
      screen.queryByText(messages.recipeDetail.errorTitle),
    ).not.toBeInTheDocument();
  });

  it("shows the error state on an unexpected load failure", async () => {
    mocks.getRecipeByIdExecute.mockRejectedValue(new Error("db down"));

    await renderDetail();

    const alert = await screen.findByRole("alert");
    expect(alert).toHaveTextContent(messages.recipeDetail.errorTitle);
  });

  it("marks the recipe as a favorite and labels the toggle accordingly", async () => {
    mocks.getFavoriteRecipesExecute.mockResolvedValue([RECIPE]);

    await renderDetail();

    expect(
      await screen.findByRole("button", {
        name: `${messages.favorites.remove}: ${RECIPE.name}`,
      }),
    ).toBeInTheDocument();
  });

  it("labels the toggle as add when the recipe is not a favorite", async () => {
    await renderDetail();

    expect(
      await screen.findByRole("button", {
        name: `${messages.favorites.add}: ${RECIPE.name}`,
      }),
    ).toBeInTheDocument();
  });

  it("redirects to /login when there is no session", async () => {
    mocks.authExecute.mockResolvedValue({ ok: true, data: null });

    await expect(renderDetail()).rejects.toThrow("redirect:/login");
    expect(mocks.redirect).toHaveBeenCalledWith("/login");
  });

  it("redirects to /login when the session expires while loading", async () => {
    mocks.getRecipeByIdExecute.mockRejectedValue(
      new UnauthorizedError("No hay sesión"),
    );

    await expect(renderDetail()).rejects.toThrow("redirect:/login");
    expect(mocks.redirect).toHaveBeenCalledWith("/login");
  });
});
