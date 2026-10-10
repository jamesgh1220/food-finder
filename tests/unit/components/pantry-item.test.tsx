import { render, screen } from "@testing-library/react";
import userEvent from "@testing-library/user-event";
import { describe, expect, it, vi } from "vitest";
import {
  PantryItem,
  type PantryItemData,
} from "@/components/pantry/pantry-item";
import { messages } from "@/lib/i18n/messages";

const item: PantryItemData = {
  id: "p1",
  name: "Tomate",
  quantity: 3,
  unit: "unidades",
};

describe("PantryItem", () => {
  it("shows name, quantity and unit in display mode", () => {
    render(<PantryItem item={item} />);

    expect(screen.getByText("Tomate")).toBeInTheDocument();
    expect(screen.getByText("3 unidades")).toBeInTheDocument();
  });

  it("reveals the inputs on 'Editar' and saves the parsed quantity and unit", async () => {
    const user = userEvent.setup();
    const onUpdate = vi.fn().mockResolvedValue(undefined);
    render(<PantryItem item={item} onUpdate={onUpdate} />);

    await user.click(
      screen.getByRole("button", {
        name: `${messages.pantry.edit}: ${item.name}`,
      }),
    );

    const quantity = screen.getByLabelText(messages.pantry.quantity);
    const unit = screen.getByLabelText(messages.pantry.unit);
    await user.clear(quantity);
    await user.type(quantity, "5");
    await user.clear(unit);
    await user.type(unit, "kg");
    await user.click(screen.getByRole("button", { name: messages.pantry.save }));

    expect(onUpdate).toHaveBeenCalledWith("p1", { quantity: 5, unit: "kg" });
  });

  it("calls onRemove with the id from the accessible remove control", async () => {
    const user = userEvent.setup();
    const onRemove = vi.fn().mockResolvedValue(undefined);
    render(<PantryItem item={item} onRemove={onRemove} />);

    await user.click(
      screen.getByRole("button", {
        name: `${messages.pantry.remove}: ${item.name}`,
      }),
    );

    expect(onRemove).toHaveBeenCalledWith("p1");
  });

  it("returns to display mode when 'Cancelar' is pressed", async () => {
    const user = userEvent.setup();
    render(<PantryItem item={item} onUpdate={vi.fn()} />);

    await user.click(
      screen.getByRole("button", {
        name: `${messages.pantry.edit}: ${item.name}`,
      }),
    );
    await user.click(
      screen.getByRole("button", { name: messages.pantry.cancel }),
    );

    expect(screen.getByText("3 unidades")).toBeInTheDocument();
    expect(
      screen.queryByLabelText(messages.pantry.quantity),
    ).not.toBeInTheDocument();
  });
});
