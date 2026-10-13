import { render, screen } from "@testing-library/react";
import { Suspense } from "react";
import { beforeEach, describe, expect, it, vi } from "vitest";
import DashboardPage from "@/app/dashboard/page";
import type { RecommendedRecipe } from "@/application/ports/recipe-recommendation";
import type { Cuisine, PantryItem } from "@/domain/entities";
import { Quantity, RecipeMatchScore, Unit } from "@/domain/value-objects";
import { messages } from "@/lib/i18n/messages";
import { makeIngredient, makeRecipe } from "./test-helpers";

/**
 * Dashboard server page behavior (spec 13, T6; REQ-01/REQ-04/REQ-05/REQ-08;
 * PROMTP #40/#70).
 *
 * `DashboardPage` is a Server Component: it awaits `searchParams`, resolves the
 * session and calls the application services directly (hop rule, spec 02). The
 * tests mock `createServerAuthServices` / `createServerApplicationServices` and
 * `next/navigation`, then render the page inside the `<Suspense>` boundary it is
 * mounted with. Because React's client renderer cannot evaluate an async
 * function component, the harness resolves the async content child the page
 * returns (`<DashboardContent />`) and renders that element tree — see the
 * limitation note in the report.
 */

const NOW = new Date("2026-01-01T00:00:00.000Z");

const mocks = vi.hoisted(() => ({
  createServerApplicationServices: vi.fn(),
  createServerAuthServices: vi.fn(),
  redirect: vi.fn(),
  pantryExecute: vi.fn(),
  cuisinesExecute: vi.fn(),
  ingredientsExecute: vi.fn(),
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
  usePathname: () => "/dashboard",
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

/**
 * Resolves the async content element the page wraps in `<Suspense>` and renders
 * it, so the real server-side data flow runs against the mocked services.
 */
async function renderDashboard(
  searchParams: Record<string, string | string[] | undefined> = {},
) {
  const page = DashboardPage({
    params: Promise.resolve({}),
    searchParams: Promise.resolve(searchParams),
  });

  // The page returns <Suspense fallback={<DashboardFallback />}>…</Suspense>.
  // React's client renderer rejects async Client Components ("<DashboardContent>
  // is an async Client Component. Only Server Components can be async at the
  // moment."), so we resolve the async content child ourselves and render the
  // element tree it produces through the same mocked server boundary.
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
  mocks.pantryExecute.mockResolvedValue([]);
  mocks.cuisinesExecute.mockResolvedValue([makeCuisine("italiana", "Italiana")]);
  mocks.ingredientsExecute.mockResolvedValue([]);
  mocks.findRecipesExecute.mockResolvedValue([]);

  mocks.createServerAuthServices.mockResolvedValue({
    getCurrentUser: { execute: mocks.authExecute },
  });
  mocks.createServerApplicationServices.mockResolvedValue({
    getUserPantry: { execute: mocks.pantryExecute },
    getCuisines: { execute: mocks.cuisinesExecute },
    searchIngredients: { execute: mocks.ingredientsExecute },
    findRecipesFromPantry: { execute: mocks.findRecipesExecute },
  });
});

describe("DashboardPage", () => {
  it("greets the authenticated user and renders the find-recipes control", async () => {
    await renderDashboard();

    expect(
      await screen.findByText(messages.dashboard.greeting("ana")),
    ).toBeInTheDocument();
    expect(
      screen.getByRole("button", { name: messages.dashboard.findRecipes }),
    ).toBeInTheDocument();
    expect(mocks.redirect).not.toHaveBeenCalled();
  });

  it("shows the friendly empty state when the pantry has no ingredients", async () => {
    await renderDashboard();

    expect(
      await screen.findByText(messages.pantry.emptyTitle),
    ).toBeInTheDocument();
    expect(
      screen.getByText(messages.pantry.emptyDescription),
    ).toBeInTheDocument();
  });

  it("renders pantry chips with the resolved ingredient names", async () => {
    mocks.pantryExecute.mockResolvedValue([makePantryItem("ing-tomate")]);
    mocks.ingredientsExecute.mockResolvedValue([
      makeIngredient({ id: "ing-tomate", name: "Tomate" }),
    ]);

    await renderDashboard();

    expect(await screen.findByText("Tomate")).toBeInTheDocument();
    expect(
      screen.queryByText(messages.pantry.emptyTitle),
    ).not.toBeInTheDocument();
  });

  it("runs the recommendation use case with the URL filters and renders the results", async () => {
    const recommendation: RecommendedRecipe = {
      recipe: makeRecipe({ id: "recipe-1", name: "Tortilla de patatas" }),
      matchScore: RecipeMatchScore.create(0.92),
      availableIngredients: ["Tomate"],
      missingIngredients: ["Cebolla"],
      optionalMissingIngredients: [],
    };
    mocks.pantryExecute.mockResolvedValue([makePantryItem("ing-tomate")]);
    mocks.ingredientsExecute.mockResolvedValue([
      makeIngredient({ id: "ing-tomate", name: "Tomate" }),
    ]);
    mocks.findRecipesExecute.mockResolvedValue([recommendation]);

    await renderDashboard({
      search: "1",
      mealType: "LUNCH",
      cuisineId: "peruana",
    });

    expect(await screen.findByText("Tortilla de patatas")).toBeInTheDocument();

    expect(mocks.findRecipesExecute).toHaveBeenCalledTimes(1);
    expect(mocks.findRecipesExecute).toHaveBeenCalledWith({
      ingredientIds: ["ing-tomate"],
      mealType: "LUNCH",
      cuisineId: "peruana",
    });
    expect(
      screen.getByText(messages.matchScore.ingredients(1, 2)),
    ).toBeInTheDocument();
  });

  it("does not search when the pantry is empty even with the search flag set", async () => {
    await renderDashboard({ search: "1", mealType: "LUNCH" });

    expect(
      await screen.findByText(messages.dashboard.resultsNoPantry),
    ).toBeInTheDocument();
    expect(mocks.findRecipesExecute).not.toHaveBeenCalled();
  });

  it("redirects to /login when there is no session", async () => {
    mocks.authExecute.mockResolvedValue({ ok: true, data: null });

    await expect(renderDashboard()).rejects.toThrow("redirect:/login");
    expect(mocks.redirect).toHaveBeenCalledWith("/login");
  });
});
