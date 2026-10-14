import { render, screen } from "@testing-library/react";
import userEvent from "@testing-library/user-event";
import { Suspense } from "react";
import { beforeEach, describe, expect, it, vi } from "vitest";
import DashboardPage from "@/app/dashboard/page";
import type { Cuisine, PantryItem } from "@/domain/entities";
import { Quantity, Unit } from "@/domain/value-objects";
import { messages } from "@/lib/i18n/messages";
import { makeIngredient } from "./test-helpers";

/**
 * Dashboard server page behavior (spec 13, T6; REQ-01/REQ-04/REQ-05/REQ-08;
 * PROMTP #40/#70; spec 14, REQ-01).
 *
 * `DashboardPage` is a Server Component: it awaits `searchParams`, resolves the
 * session and calls the application services directly (hop rule, spec 02). The
 * tests mock `createServerAuthServices` / `createServerApplicationServices` and
 * `next/navigation`, then render the page inside the `<Suspense>` boundary it is
 * mounted with. Because React's client renderer cannot evaluate an async
 * function component, the harness resolves the async content child the page
 * returns (`<DashboardContent />`) and renders that element tree — see the
 * limitation note in the report.
 *
 * Spec 14 moved the results to `/dashboard/recipes`, so this page is now the
 * search entry and no longer runs the recommendation use case.
 */

const NOW = new Date("2026-01-01T00:00:00.000Z");

const mocks = vi.hoisted(() => ({
  createServerApplicationServices: vi.fn(),
  createServerAuthServices: vi.fn(),
  redirect: vi.fn(),
  pantryExecute: vi.fn(),
  cuisinesExecute: vi.fn(),
  ingredientsExecute: vi.fn(),
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

  mocks.createServerAuthServices.mockResolvedValue({
    getCurrentUser: { execute: mocks.authExecute },
  });
  // Deliberately omits `findRecipesFromPantry` and `generateRecipeFromPrompt`:
  // if the dashboard still ran either use case during initial render, this mock
  // would throw and the test would fail. The chef action is exercised through
  // its own form test, not through the initial page render.
  mocks.createServerApplicationServices.mockResolvedValue({
    getUserPantry: { execute: mocks.pantryExecute },
    getCuisines: { execute: mocks.cuisinesExecute },
    searchIngredients: { execute: mocks.ingredientsExecute },
  });
});

describe("DashboardPage", () => {
  it("greets the authenticated user and opens on the chef prompt tab", async () => {
    await renderDashboard();

    expect(
      await screen.findByText(messages.dashboard.greeting("ana")),
    ).toBeInTheDocument();
    expect(
      screen.getByRole("tab", { name: messages.chef.tabPrompt }),
    ).toHaveAttribute("aria-selected", "true");
    expect(
      screen.getByLabelText(messages.chef.promptLabel),
    ).toBeInTheDocument();
    // The structured filters live behind their own tab now.
    expect(
      screen.queryByRole("button", { name: messages.dashboard.findRecipes }),
    ).not.toBeInTheDocument();
    expect(mocks.redirect).not.toHaveBeenCalled();
  });

  it("reveals the find-recipes control on the filters tab and submits to the recipes route", async () => {
    const user = userEvent.setup();
    await renderDashboard();

    await user.click(
      screen.getByRole("tab", { name: messages.chef.tabFilters }),
    );

    const form = screen
      .getByRole("button", { name: messages.dashboard.findRecipes })
      .closest("form");

    expect(form).toHaveAttribute("action", "/dashboard/recipes");
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

  it("no longer renders inline recommendations (results moved to /dashboard/recipes)", async () => {
    mocks.pantryExecute.mockResolvedValue([makePantryItem("ing-tomate")]);
    mocks.ingredientsExecute.mockResolvedValue([
      makeIngredient({ id: "ing-tomate", name: "Tomate" }),
    ]);

    await renderDashboard({ mealType: "LUNCH", cuisineId: "peruana" });

    expect(await screen.findByText("Tomate")).toBeInTheDocument();
    // The old results heading and states are gone from the dashboard.
    expect(screen.queryByText("Recetas para ti")).not.toBeInTheDocument();
    expect(
      screen.queryByText(messages.recipesPage.emptyTitle),
    ).not.toBeInTheDocument();
  });

  it("redirects to /login when there is no session", async () => {
    mocks.authExecute.mockResolvedValue({ ok: true, data: null });

    await expect(renderDashboard()).rejects.toThrow("redirect:/login");
    expect(mocks.redirect).toHaveBeenCalledWith("/login");
  });
});
