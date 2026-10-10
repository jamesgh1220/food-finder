import { render, screen } from "@testing-library/react";
import userEvent from "@testing-library/user-event";
import { describe, expect, it, vi } from "vitest";
import { IngredientSelector } from "@/components/ingredients/ingredient-selector";

const selected = [
  { id: "ing-tomate", name: "Tomate" },
  { id: "ing-cebolla", name: "Cebolla" },
];

describe("IngredientSelector", () => {
  it("renders a chip per selected ingredient", () => {
    render(<IngredientSelector selected={selected} onRemove={vi.fn()} />);

    expect(screen.getByText("Tomate")).toBeInTheDocument();
    expect(screen.getByText("Cebolla")).toBeInTheDocument();
  });

  it("calls onRemove with the id from the accessible remove control", async () => {
    const user = userEvent.setup();
    const onRemove = vi.fn();
    render(<IngredientSelector selected={selected} onRemove={onRemove} />);

    await user.click(screen.getByRole("button", { name: "Quitar Tomate" }));

    expect(onRemove).toHaveBeenCalledWith("ing-tomate");
  });

  it("shows the default empty message when nothing is selected", () => {
    render(<IngredientSelector selected={[]} onRemove={vi.fn()} />);

    expect(
      screen.getByText("Todavía no agregaste ingredientes."),
    ).toBeInTheDocument();
  });

  it("accepts a custom empty label", () => {
    render(
      <IngredientSelector
        selected={[]}
        onRemove={vi.fn()}
        emptyLabel="Sin ingredientes"
      />,
    );

    expect(screen.getByText("Sin ingredientes")).toBeInTheDocument();
  });
});
