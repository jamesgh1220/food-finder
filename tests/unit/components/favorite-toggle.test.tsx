import { render, screen } from "@testing-library/react";
import userEvent from "@testing-library/user-event";
import { beforeEach, describe, expect, it, vi } from "vitest";
import { FavoriteToggle } from "@/components/favorites/favorite-toggle";
import { messages } from "@/lib/i18n/messages";

/**
 * FavoriteToggle container (spec 14, REQ-08; PROMTP #44; Caso 6).
 *
 * Client container between the presentational `FavoriteButton` and the
 * favorites Server Actions. It owns the error surface: a rejected action or a
 * `{ ok: false }` result must show a user-visible message (`role="alert"`) and
 * propagate the rejection so the button reverts its optimistic flip. The real
 * actions module is mocked — importing it as-is would pull `next/cache`.
 */

const mocks = vi.hoisted(() => ({
  addFavoriteAction: vi.fn(),
  removeFavoriteAction: vi.fn(),
}));

vi.mock("@/app/dashboard/favorites/actions", () => ({
  addFavoriteAction: mocks.addFavoriteAction,
  removeFavoriteAction: mocks.removeFavoriteAction,
}));

/** Fallback copy `FavoriteToggle` shows when the action rejects outright. */
const ACTION_ERROR_FALLBACK =
  "No pudimos actualizar tus favoritos. Inténtalo de nuevo.";

beforeEach(() => {
  vi.clearAllMocks();
  mocks.addFavoriteAction.mockResolvedValue({ ok: true });
  mocks.removeFavoriteAction.mockResolvedValue({ ok: true });
});

describe("FavoriteToggle", () => {
  it("calls addFavoriteAction when toggled from the not-favorite state", async () => {
    const user = userEvent.setup();
    render(<FavoriteToggle recipeId="recipe-1" isFavorite={false} />);

    await user.click(
      screen.getByRole("button", { name: messages.favorites.add }),
    );

    expect(mocks.addFavoriteAction).toHaveBeenCalledWith({
      recipeId: "recipe-1",
    });
    expect(mocks.removeFavoriteAction).not.toHaveBeenCalled();
    expect(screen.queryByRole("alert")).not.toBeInTheDocument();
  });

  it("calls removeFavoriteAction when toggled from the favorite state", async () => {
    const user = userEvent.setup();
    render(<FavoriteToggle recipeId="recipe-9" isFavorite />);

    await user.click(
      screen.getByRole("button", { name: messages.favorites.remove }),
    );

    expect(mocks.removeFavoriteAction).toHaveBeenCalledWith({
      recipeId: "recipe-9",
    });
    expect(mocks.addFavoriteAction).not.toHaveBeenCalled();
  });

  it("includes the recipe name in the accessible label", () => {
    render(
      <FavoriteToggle
        recipeId="recipe-1"
        isFavorite={false}
        recipeName="Tortilla de patatas"
      />,
    );

    expect(
      screen.getByRole("button", {
        name: `${messages.favorites.add}: Tortilla de patatas`,
      }),
    ).toBeInTheDocument();
  });

  it("shows the failure message returned by the action and reverts the button", async () => {
    const user = userEvent.setup();
    mocks.addFavoriteAction.mockResolvedValue({
      ok: false,
      message: "Tu sesión expiró. Vuelve a iniciar sesión.",
    });

    render(<FavoriteToggle recipeId="recipe-1" isFavorite={false} />);

    const button = screen.getByRole("button", {
      name: messages.favorites.add,
    });
    await user.click(button);

    expect(
      await screen.findByRole("alert"),
    ).toHaveTextContent("Tu sesión expiró. Vuelve a iniciar sesión.");
    expect(button).toHaveAttribute("aria-pressed", "false");
  });

  it("falls back to a generic message when the action rejects", async () => {
    const user = userEvent.setup();
    mocks.removeFavoriteAction.mockRejectedValue(new Error("boom"));

    render(<FavoriteToggle recipeId="recipe-1" isFavorite />);

    await user.click(
      screen.getByRole("button", { name: messages.favorites.remove }),
    );

    expect(await screen.findByRole("alert")).toHaveTextContent(
      ACTION_ERROR_FALLBACK,
    );
  });

  it("clears a previous error before the next attempt", async () => {
    const user = userEvent.setup();
    mocks.addFavoriteAction.mockResolvedValueOnce({
      ok: false,
      message: "No pudimos completar la acción. Inténtalo de nuevo.",
    });

    render(<FavoriteToggle recipeId="recipe-1" isFavorite={false} />);

    const button = screen.getByRole("button", {
      name: messages.favorites.add,
    });
    await user.click(button);
    expect(await screen.findByRole("alert")).toBeInTheDocument();

    await user.click(button);

    expect(mocks.addFavoriteAction).toHaveBeenCalledTimes(2);
  });
});
