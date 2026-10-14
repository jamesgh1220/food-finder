import { render, screen } from "@testing-library/react";
import userEvent from "@testing-library/user-event";
import { Suspense } from "react";
import { beforeEach, describe, expect, it, vi } from "vitest";
import FavoritesPage from "@/app/dashboard/favorites/page";
import { UnauthorizedError } from "@/domain/errors";
import { messages } from "@/lib/i18n/messages";
import { makeRecipe } from "./test-helpers";

/**
 * Favorites route (spec 14, REQ-03/REQ-08/REQ-10; PROMTP #44; Caso 6).
 *
 * `FavoritesPage` is a Server Component: it resolves the session and loads the
 * saved recipes through `GetFavoriteRecipes` (hop rule, spec 02), then hands them
 * to the `FavoritesList` client container. The tests mock the server composition
 * and the favorites Server Actions (the list renders `FavoriteToggle`, which
 * imports `next/cache`), then resolve the async content child the page wraps in
 * `<Suspense>`.
 */

const mocks = vi.hoisted(() => ({
  createServerApplicationServices: vi.fn(),
  createServerAuthServices: vi.fn(),
  redirect: vi.fn(),
  authExecute: vi.fn(),
  favoritesExecute: vi.fn(),
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
  usePathname: () => "/dashboard/favorites",
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

const TORTILLA = makeRecipe({ id: "recipe-1", name: "Tortilla de patatas" });
const ENSALADA = makeRecipe({ id: "recipe-2", name: "Ensalada César" });

/**
 * Resolves the async content element the page wraps in `<Suspense>` and renders
 * it, so the real server-side data flow runs against the mocked services.
 */
async function renderFavorites() {
  const page = FavoritesPage();

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
  mocks.favoritesExecute.mockResolvedValue([TORTILLA, ENSALADA]);

  mocks.createServerAuthServices.mockResolvedValue({
    getCurrentUser: { execute: mocks.authExecute },
  });
  mocks.createServerApplicationServices.mockResolvedValue({
    getFavoriteRecipes: { execute: mocks.favoritesExecute },
  });
});

describe("FavoritesPage", () => {
  it("lists the saved recipes with the local search control", async () => {
    await renderFavorites();

    expect(
      await screen.findByText(messages.favorites.heading),
    ).toBeInTheDocument();
    expect(screen.getByText(TORTILLA.name)).toBeInTheDocument();
    expect(screen.getByText(ENSALADA.name)).toBeInTheDocument();
    expect(
      screen.getByLabelText(messages.favorites.searchLabel),
    ).toBeInTheDocument();
    expect(mocks.redirect).not.toHaveBeenCalled();
  });

  it("filters the list by name locally, without another request", async () => {
    const user = userEvent.setup();
    await renderFavorites();

    await screen.findByText(TORTILLA.name);
    await user.type(
      screen.getByLabelText(messages.favorites.searchLabel),
      "ensalada",
    );

    expect(screen.getByText(ENSALADA.name)).toBeInTheDocument();
    expect(screen.queryByText(TORTILLA.name)).not.toBeInTheDocument();
    expect(mocks.favoritesExecute).toHaveBeenCalledTimes(1);
  });

  it("shows the no-matches state when the search has no results", async () => {
    const user = userEvent.setup();
    await renderFavorites();

    await screen.findByText(TORTILLA.name);
    await user.type(
      screen.getByLabelText(messages.favorites.searchLabel),
      "zzz",
    );

    expect(
      screen.getByText(messages.favorites.noMatches),
    ).toBeInTheDocument();
    expect(screen.queryByText(TORTILLA.name)).not.toBeInTheDocument();
    expect(screen.queryByText(ENSALADA.name)).not.toBeInTheDocument();
  });

  it("shows the empty state when there are no favorites", async () => {
    mocks.favoritesExecute.mockResolvedValue([]);

    await renderFavorites();

    expect(
      await screen.findByText(messages.favorites.emptyTitle),
    ).toBeInTheDocument();
    expect(
      screen.queryByLabelText(messages.favorites.searchLabel),
    ).not.toBeInTheDocument();
  });

  it("shows the error state when the favorites fail to load", async () => {
    mocks.favoritesExecute.mockRejectedValue(new Error("db down"));

    await renderFavorites();

    const alert = await screen.findByRole("alert");
    expect(alert).toHaveTextContent(messages.favorites.errorTitle);
  });

  it("redirects to /login when the session expires while loading", async () => {
    mocks.favoritesExecute.mockRejectedValue(
      new UnauthorizedError("No hay sesión"),
    );

    await expect(renderFavorites()).rejects.toThrow("redirect:/login");
    expect(mocks.redirect).toHaveBeenCalledWith("/login");
  });

  it("redirects to /login when there is no session", async () => {
    mocks.authExecute.mockResolvedValue({ ok: true, data: null });

    await expect(renderFavorites()).rejects.toThrow("redirect:/login");
    expect(mocks.redirect).toHaveBeenCalledWith("/login");
  });
});
