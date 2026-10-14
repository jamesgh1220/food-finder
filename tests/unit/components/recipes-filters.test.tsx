import { render, screen } from "@testing-library/react";
import userEvent from "@testing-library/user-event";
import { beforeEach, describe, expect, it, vi } from "vitest";
import type { CuisineOption } from "@/components/filters/cuisine-selector";
import { RecipesFilters } from "@/components/recipes/recipes-filters";
import { mealTypeLabels, messages } from "@/lib/i18n/messages";

/**
 * RecipesFilters behavior (spec 14, REQ-01/REQ-06; PROMTP #42/#70).
 *
 * Client-only filter block for the results page. The URL is the single source of
 * truth: every change rewrites the query string with `router.replace` (preserving
 * params it does not own), and there is no submit button because on the results
 * page the filters ARE the search. These tests mock `next/navigation` so the
 * component renders outside a live App Router context.
 */

const { replaceMock, routerState } = vi.hoisted(() => ({
  replaceMock: vi.fn(),
  routerState: {
    pathname: "/dashboard/recipes",
    searchParams: new URLSearchParams(),
  },
}));

vi.mock("next/navigation", () => ({
  useRouter: () => ({
    replace: replaceMock,
    push: vi.fn(),
    refresh: vi.fn(),
    prefetch: vi.fn(),
    back: vi.fn(),
    forward: vi.fn(),
  }),
  usePathname: () => routerState.pathname,
  useSearchParams: () => routerState.searchParams,
}));

const cuisines: CuisineOption[] = [
  { id: "italiana", name: "Italiana" },
  { id: "peruana", name: "Peruana" },
];

/** The single URL string passed to `router.replace`, parsed for assertions. */
function replacedUrl(): URL {
  expect(replaceMock).toHaveBeenCalledTimes(1);
  const [target] = replaceMock.mock.calls[0];
  return new URL(target, "http://localhost");
}

beforeEach(() => {
  vi.clearAllMocks();
  routerState.pathname = "/dashboard/recipes";
  routerState.searchParams = new URLSearchParams();
});

describe("RecipesFilters", () => {
  it("renders the filter legend, meal-type options and cuisine selector", () => {
    render(
      <RecipesFilters
        cuisines={cuisines}
        initialMealType="ANY"
        initialCuisineId={null}
      />,
    );

    expect(screen.getByText(messages.recipesPage.filtersLegend)).toBeInTheDocument();
    expect(
      screen.getByRole("radio", { name: mealTypeLabels.LUNCH }),
    ).toBeInTheDocument();
    expect(
      screen.getByLabelText(messages.cuisines.label),
    ).toBeInTheDocument();
  });

  it("sets the meal type on replace while preserving the existing cuisine param", async () => {
    const user = userEvent.setup();
    routerState.searchParams = new URLSearchParams("cuisineId=peruana");

    render(
      <RecipesFilters
        cuisines={cuisines}
        initialMealType="ANY"
        initialCuisineId="peruana"
      />,
    );

    await user.click(screen.getByRole("radio", { name: mealTypeLabels.LUNCH }));

    const url = replacedUrl();
    expect(url.pathname).toBe("/dashboard/recipes");
    expect(url.searchParams.get("mealType")).toBe("LUNCH");
    expect(url.searchParams.get("cuisineId")).toBe("peruana");
    expect(replaceMock).toHaveBeenCalledWith(expect.any(String), {
      scroll: false,
    });
  });

  it("sets the cuisine id on replace and keeps the meal type", async () => {
    const user = userEvent.setup();
    routerState.searchParams = new URLSearchParams("mealType=LUNCH");

    render(
      <RecipesFilters
        cuisines={cuisines}
        initialMealType="LUNCH"
        initialCuisineId={null}
      />,
    );

    await user.selectOptions(
      screen.getByLabelText(messages.cuisines.label),
      "peruana",
    );

    const url = replacedUrl();
    expect(url.searchParams.get("cuisineId")).toBe("peruana");
    expect(url.searchParams.get("mealType")).toBe("LUNCH");
  });

  it("removes the cuisine param when 'Todas' is selected", async () => {
    const user = userEvent.setup();
    routerState.searchParams = new URLSearchParams(
      "mealType=LUNCH&cuisineId=italiana",
    );

    render(
      <RecipesFilters
        cuisines={cuisines}
        initialMealType="LUNCH"
        initialCuisineId="italiana"
      />,
    );

    await user.selectOptions(
      screen.getByLabelText(messages.cuisines.label),
      "",
    );

    const url = replacedUrl();
    expect(url.searchParams.has("cuisineId")).toBe(false);
    expect(url.searchParams.get("mealType")).toBe("LUNCH");
  });

  it("renders no submit button (filters are the search)", () => {
    render(
      <RecipesFilters
        cuisines={cuisines}
        initialMealType="ANY"
        initialCuisineId={null}
      />,
    );

    expect(screen.queryByRole("button", { name: /recetas/i })).not.toBeInTheDocument();
    expect(
      screen.queryByRole("button", { name: messages.dashboard.findRecipes }),
    ).not.toBeInTheDocument();
  });
});
