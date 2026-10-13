import { render, screen } from "@testing-library/react";
import { Suspense } from "react";
import { beforeEach, describe, expect, it, vi } from "vitest";
import RecipesPage from "@/app/dashboard/recipes/page";
import type { RecommendedRecipe } from "@/application/ports/recipe-recommendation";
import type { Cuisine, PantryItem } from "@/domain/entities";
import { UnauthorizedError } from "@/domain/errors";
import { Quantity, RecipeMatchScore, Unit } from "@/domain/value-objects";
import { mealTypeLabels, messages } from "@/lib/i18n/messages";
import { makeRecipe } from "./test-helpers";

/**
 * Recipes results page (spec 14, REQ-01/REQ-05/REQ-06/REQ-10; PROMTP #42/#71/#72).
 *
 * `RecipesPage` is a Server Component: it awaits `searchParams`, resolves the
 * session and calls the application services directly (hop rule, spec 02). The
 * tests mock `createServerAuthServices` / `createServerApplicationServices` and
 * `next/navigation`, then resolve the async content child the page wraps in
 * `<Suspense>` (`<RecipesContent />`) and render that element tree — React's
 * client renderer cannot evaluate an async function component.
 */

const NOW = new Date("2026-01-01T00:00:00.000Z");

const mocks = vi.hoisted(() => ({
  createServerApplicationServices: vi.fn(),
  createServerAuthServices: vi.fn(),
  redirect: vi.fn(),
  pantryExecute: vi.fn(),
  cuisinesExecute: vi.fn(),
  findRecipesExecute: vi.fn(),
  authExecute: vi.fn(),
}));

vi.mock("@/lib/composition/server-application", () => ({
  createServerApplicationServices: mocks.createServerApplicationServices,
}));

vi.mock("@/lib/composition/server-auth", () => ({
  createServerAuthServices: mocks.createServerAuthServices,
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
  usePathname: () => "/dashboard/recipes",
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

const RECIPE = makeRecipe({ id: "recipe-1", name: "Tortilla de patatas" });

function makeRecommendation(
  overrides: Partial<RecommendedRecipe> = {},
): RecommendedRecipe {
  return {
    recipe: RECIPE,
    matchScore: RecipeMatchScore.create(0.92),
    availableIngredients: ["Tomate", "Cebolla"],
    missingIngredients: ["Huevo"],
    optionalMissingIngredients: [],
    ...overrides,
  };
}

/**
 * Resolves the async content element the page wraps in `<Suspense>` and renders
 * it, so the real server-side data flow runs against the mocked services.
 */
async function renderRecipes(
  searchParams: Record<string, string | string[] | undefined> = {},
) {
  const page = RecipesPage({
    params: Promise.resolve({}),
    searchParams: Promise.resolve(searchParams),
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
  mocks.authExecute.mockResolvedValue({ ok: true, data: sessionUser });
  mocks.pantryExecute.mockResolvedValue([makePantryItem("ing-tomate")]);
  mocks.cuisinesExecute.mockResolvedValue([makeCuisine("italiana", "Italiana")]);
  mocks.findRecipesExecute.mockResolvedValue([makeRecommendation()]);

  mocks.createServerAuthServices.mockResolvedValue({
    getCurrentUser: { execute: mocks.authExecute },
  });
  mocks.createServerApplicationServices.mockResolvedValue({
    getUserPantry: { execute: mocks.pantryExecute },
    getCuisines: { execute: mocks.cuisinesExecute },
    findRecipesFromPantry: { execute: mocks.findRecipesExecute },
  });
});

describe("RecipesPage", () => {
  it("renders the heading, filter block and explained recipe cards", async () => {
    await renderRecipes();

    expect(
      await screen.findByText(messages.recipesPage.heading),
    ).toBeInTheDocument();
    expect(
      screen.getByText(messages.recipesPage.filtersLegend),
    ).toBeInTheDocument();
    expect(
      screen.getByRole("radio", { name: mealTypeLabels.LUNCH }),
    ).toBeInTheDocument();
    expect(
      screen.getByRole("link", { name: RECIPE.name }),
    ).toBeInTheDocument();
    // REQ-05: the card explains the score as "Tienes X de Y ingredientes".
    expect(
      screen.getByText(messages.matchScore.ingredients(2, 3)),
    ).toBeInTheDocument();
    expect(mocks.redirect).not.toHaveBeenCalled();
  });

  it("passes the pantry ids, meal type and cuisine to the recommendation engine", async () => {
    await renderRecipes({ mealType: "LUNCH", cuisineId: "peruana" });

    await screen.findByRole("link", { name: RECIPE.name });

    expect(mocks.findRecipesExecute).toHaveBeenCalledWith({
      ingredientIds: ["ing-tomate"],
      mealType: "LUNCH",
      cuisineId: "peruana",
    });
  });

  it("normalizes invalid or missing filters to ANY and no cuisine", async () => {
    await renderRecipes({ mealType: "BRUNCH", cuisineId: "" });

    await screen.findByRole("link", { name: RECIPE.name });

    expect(mocks.findRecipesExecute).toHaveBeenCalledWith({
      ingredientIds: ["ing-tomate"],
      mealType: "ANY",
      cuisineId: null,
    });
  });

  it("shows the add-ingredients empty state when the pantry is empty", async () => {
    mocks.pantryExecute.mockResolvedValue([]);

    await renderRecipes();

    expect(
      await screen.findByText(messages.recipesPage.noPantryTitle),
    ).toBeInTheDocument();
    expect(mocks.findRecipesExecute).not.toHaveBeenCalled();
  });

  it("shows the no-results empty state when the engine returns nothing", async () => {
    mocks.findRecipesExecute.mockResolvedValue([]);

    await renderRecipes();

    expect(
      await screen.findByText(messages.recipesPage.emptyTitle),
    ).toBeInTheDocument();
    expect(
      screen.getByText(messages.recipesPage.emptyDescription),
    ).toBeInTheDocument();
  });

  it("shows the error state when the recommendation engine fails", async () => {
    mocks.findRecipesExecute.mockRejectedValue(new Error("engine down"));

    await renderRecipes();

    const alert = await screen.findByRole("alert");
    expect(alert).toHaveTextContent(messages.recipesPage.errorTitle);
    expect(screen.getByText(messages.recipesPage.errorDescription)).toBeInTheDocument();
  });

  it("shows the error state when the pantry or cuisines fail to load", async () => {
    mocks.pantryExecute.mockRejectedValue(new Error("db down"));

    await renderRecipes();

    const alert = await screen.findByRole("alert");
    expect(alert).toHaveTextContent(messages.recipesPage.errorTitle);
    expect(mocks.findRecipesExecute).not.toHaveBeenCalled();
  });

  it("redirects to /login when the session expires while loading", async () => {
    mocks.pantryExecute.mockRejectedValue(
      new UnauthorizedError("No hay sesión"),
    );

    await expect(renderRecipes()).rejects.toThrow("redirect:/login");
    expect(mocks.redirect).toHaveBeenCalledWith("/login");
  });

  it("redirects to /login when there is no session", async () => {
    mocks.authExecute.mockResolvedValue({ ok: true, data: null });

    await expect(renderRecipes()).rejects.toThrow("redirect:/login");
    expect(mocks.redirect).toHaveBeenCalledWith("/login");
  });
});
