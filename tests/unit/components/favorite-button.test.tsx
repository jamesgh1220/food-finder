import { render, screen, waitFor } from "@testing-library/react";
import userEvent from "@testing-library/user-event";
import { describe, expect, it, vi } from "vitest";
import { FavoriteButton } from "@/components/favorites/favorite-button";
import { messages } from "@/lib/i18n/messages";

describe("FavoriteButton", () => {
  it("reflects the favorite state through aria-pressed", () => {
    const { rerender } = render(
      <FavoriteButton isFavorite={false} onToggle={vi.fn()} />,
    );
    expect(screen.getByRole("button")).toHaveAttribute("aria-pressed", "false");

    rerender(<FavoriteButton isFavorite onToggle={vi.fn()} />);
    expect(screen.getByRole("button")).toHaveAttribute("aria-pressed", "true");
  });

  it("includes the recipe name in the accessible label", () => {
    render(
      <FavoriteButton
        isFavorite={false}
        onToggle={vi.fn()}
        recipeName="Tortilla"
      />,
    );

    expect(
      screen.getByRole("button", {
        name: `${messages.favorites.add}: Tortilla`,
      }),
    ).toBeInTheDocument();
  });

  it("toggles optimistically with the flipped value and updates aria-pressed", async () => {
    const user = userEvent.setup();
    const onToggle = vi.fn().mockResolvedValue(undefined);
    render(<FavoriteButton isFavorite={false} onToggle={onToggle} />);

    await user.click(screen.getByRole("button"));

    expect(onToggle).toHaveBeenCalledWith(true);
    await waitFor(() =>
      expect(screen.getByRole("button")).toHaveAttribute(
        "aria-pressed",
        "true",
      ),
    );
  });

  it("reverts the optimistic state when onToggle rejects", async () => {
    const user = userEvent.setup();
    const onToggle = vi.fn().mockRejectedValue(new Error("mutation failed"));
    render(<FavoriteButton isFavorite={false} onToggle={onToggle} />);

    await user.click(screen.getByRole("button"));

    expect(onToggle).toHaveBeenCalledWith(true);
    await waitFor(() =>
      expect(screen.getByRole("button")).toHaveAttribute(
        "aria-pressed",
        "false",
      ),
    );
  });
});
