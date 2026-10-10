import { render, screen } from "@testing-library/react";
import userEvent from "@testing-library/user-event";
import { describe, expect, it, vi } from "vitest";
import { IngredientSearch } from "@/components/ingredients/ingredient-search";
import { makeIngredient } from "./test-helpers";

const tomate = makeIngredient({
  id: "ing-tomate",
  name: "Tomate",
  normalizedName: "tomate",
});
const cebolla = makeIngredient({
  id: "ing-cebolla",
  name: "Cebolla",
  normalizedName: "cebolla",
});

describe("IngredientSearch", () => {
  it("debounces typing into a single onSearch call with the trimmed query", async () => {
    const user = userEvent.setup();
    const onSearch = vi.fn().mockResolvedValue([tomate]);
    render(
      <IngredientSearch
        onSearch={onSearch}
        onSelect={vi.fn()}
        debounceMs={400}
      />,
    );

    // Six keystrokes: an undebounced implementation would call onSearch six
    // times; the debounce collapses them into one call for the final query.
    await user.type(screen.getByRole("combobox"), "tomate");
    await screen.findByRole("option", { name: "Tomate" });

    expect(onSearch).toHaveBeenCalledTimes(1);
    expect(onSearch).toHaveBeenCalledWith("tomate");
  });

  it("renders matching results as options", async () => {
    const user = userEvent.setup();
    const onSearch = vi.fn().mockResolvedValue([tomate, cebolla]);
    render(
      <IngredientSearch onSearch={onSearch} onSelect={vi.fn()} debounceMs={20} />,
    );

    await user.type(screen.getByRole("combobox"), "t");

    expect(await screen.findAllByRole("option")).toHaveLength(2);
    expect(
      screen.getByRole("option", { name: "Tomate" }),
    ).toBeInTheDocument();
    expect(
      screen.getByRole("option", { name: "Cebolla" }),
    ).toBeInTheDocument();
  });

  it("calls onSelect with the ingredient when an option is clicked", async () => {
    const user = userEvent.setup();
    const onSearch = vi.fn().mockResolvedValue([tomate]);
    const onSelect = vi.fn();
    render(
      <IngredientSearch
        onSearch={onSearch}
        onSelect={onSelect}
        debounceMs={20}
      />,
    );

    await user.type(screen.getByRole("combobox"), "tom");
    await user.click(await screen.findByRole("option", { name: "Tomate" }));

    expect(onSelect).toHaveBeenCalledWith(tomate);
  });

  it("selects the active option with ArrowDown + Enter", async () => {
    const user = userEvent.setup();
    const onSearch = vi.fn().mockResolvedValue([tomate, cebolla]);
    const onSelect = vi.fn();
    render(
      <IngredientSearch
        onSearch={onSearch}
        onSelect={onSelect}
        debounceMs={20}
      />,
    );

    await user.type(screen.getByRole("combobox"), "tom");
    await screen.findByRole("option", { name: "Tomate" });
    await user.keyboard("{ArrowDown}{Enter}");

    expect(onSelect).toHaveBeenCalledWith(tomate);
  });

  it("shows the no-results message when the search returns nothing", async () => {
    const user = userEvent.setup();
    const onSearch = vi.fn().mockResolvedValue([]);
    render(
      <IngredientSearch onSearch={onSearch} onSelect={vi.fn()} debounceMs={20} />,
    );

    await user.type(screen.getByRole("combobox"), "zzz");

    expect(await screen.findByText("Sin resultados")).toBeInTheDocument();
  });

  it("shows the error message when onSearch rejects", async () => {
    const user = userEvent.setup();
    const onSearch = vi.fn().mockRejectedValue(new Error("network"));
    render(
      <IngredientSearch onSearch={onSearch} onSelect={vi.fn()} debounceMs={20} />,
    );

    await user.type(screen.getByRole("combobox"), "tom");

    const alert = await screen.findByRole("alert");
    expect(alert).toHaveTextContent(
      "No pudimos buscar ingredientes. Inténtalo de nuevo.",
    );
  });
});
