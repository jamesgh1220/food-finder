import { render, screen } from "@testing-library/react";
import userEvent from "@testing-library/user-event";
import { beforeEach, describe, expect, it, vi } from "vitest";
import { DashboardControls } from "@/components/dashboard/dashboard-controls";
import type { CuisineOption } from "@/components/filters/cuisine-selector";
import { mealTypeLabels, messages } from "@/lib/i18n/messages";

/**
 * DashboardControls behavior (spec 13, T6; REQ-01/REQ-04/REQ-06; PROMTP #40/#70).
 *
 * The URL is the single source of truth for the dashboard filters: the
 * selectors rewrite the query string through `router.replace` (preserving the
 * params they do not own) and the **Encontrar recetas** control is a plain GET
 * form to `/dashboard` that flips `search=1`. These tests mock `next/navigation`
 * so the component renders outside a live App Router context.
 */

const { replaceMock, routerState } = vi.hoisted(() => ({
  replaceMock: vi.fn(),
  routerState: {
    pathname: "/dashboard",
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
  { id: "mexicana", name: "Mexicana" },
];

/** The single URL string passed to `router.replace`, parsed for assertions. */
function replacedUrl(): URL {
  expect(replaceMock).toHaveBeenCalledTimes(1);
  const [target] = replaceMock.mock.calls[0];
  return new URL(target, "http://localhost");
}

beforeEach(() => {
  vi.clearAllMocks();
  routerState.pathname = "/dashboard";
  routerState.searchParams = new URLSearchParams();
});

describe("DashboardControls", () => {
  it("sets the meal type on replace while preserving the existing query params", async () => {
    const user = userEvent.setup();
    routerState.searchParams = new URLSearchParams("search=1&cuisineId=italiana");

    render(
      <DashboardControls
        cuisines={cuisines}
        initialMealType="ANY"
        initialCuisineId="italiana"
      />,
    );

    await user.click(screen.getByRole("radio", { name: mealTypeLabels.LUNCH }));

    const url = replacedUrl();
    expect(url.pathname).toBe("/dashboard");
    expect(url.searchParams.get("mealType")).toBe("LUNCH");
    // Existing params owned by other controls must survive the update.
    expect(url.searchParams.get("cuisineId")).toBe("italiana");
    expect(url.searchParams.get("search")).toBe("1");
    expect(replaceMock).toHaveBeenCalledWith(expect.any(String), {
      scroll: false,
    });
  });

  it("sets the cuisine id on replace and keeps the meal type and search flag", async () => {
    const user = userEvent.setup();
    routerState.searchParams = new URLSearchParams("search=1&mealType=LUNCH");

    render(
      <DashboardControls
        cuisines={cuisines}
        initialMealType="LUNCH"
        initialCuisineId={null}
      />,
    );

    await user.selectOptions(
      screen.getByLabelText(messages.cuisines.label),
      "mexicana",
    );

    const url = replacedUrl();
    expect(url.searchParams.get("cuisineId")).toBe("mexicana");
    expect(url.searchParams.get("mealType")).toBe("LUNCH");
    expect(url.searchParams.get("search")).toBe("1");
  });

  it("removes the cuisine param when 'Todas' is selected", async () => {
    const user = userEvent.setup();
    routerState.searchParams = new URLSearchParams(
      "search=1&mealType=LUNCH&cuisineId=italiana",
    );

    render(
      <DashboardControls
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
    expect(url.searchParams.get("search")).toBe("1");
  });

  it("renders a GET form to /dashboard that submits search=1 and the current filters", () => {
    routerState.searchParams = new URLSearchParams("mealType=LUNCH&cuisineId=italiana");

    render(
      <DashboardControls
        cuisines={cuisines}
        initialMealType="LUNCH"
        initialCuisineId="italiana"
      />,
    );

    const form = screen
      .getByRole("button", { name: messages.dashboard.findRecipes })
      .closest("form");
    expect(form).not.toBeNull();
    if (!form) {
      throw new Error("Encontrar recetas form not found");
    }

    expect(form).toHaveAttribute("action", "/dashboard");
    expect(form.getAttribute("method")?.toLowerCase()).toBe("get");

    const field = (name: string) =>
      form.querySelector<HTMLInputElement>(`input[name="${name}"]`);
    expect(field("search")).toHaveValue("1");
    expect(field("mealType")).toHaveValue("LUNCH");
    expect(field("cuisineId")).toHaveValue("italiana");
  });

  it("omits the hidden cuisine input when no cuisine is selected", () => {
    render(
      <DashboardControls
        cuisines={cuisines}
        initialMealType="ANY"
        initialCuisineId={null}
      />,
    );

    const form = screen
      .getByRole("button", { name: messages.dashboard.findRecipes })
      .closest("form");
    expect(form).not.toBeNull();
    if (!form) {
      throw new Error("Encontrar recetas form not found");
    }

    expect(form.querySelector('input[name="cuisineId"]')).toBeNull();
    expect(form.querySelector<HTMLInputElement>('input[name="mealType"]')).toHaveValue(
      "ANY",
    );
  });
});
