import { render, screen, waitFor } from "@testing-library/react";
import userEvent from "@testing-library/user-event";
import { beforeEach, describe, expect, it, vi } from "vitest";
import {
  addPantryIngredientAction,
  clearUserPantryAction,
  removePantryIngredientAction,
  searchIngredientsAction,
  updatePantryIngredientAction,
} from "@/app/dashboard/pantry/actions";
import { PantryManager } from "@/components/pantry/pantry-manager";
import type { PantryItemData } from "@/components/pantry/pantry-item";
import { messages } from "@/lib/i18n/messages";
import { makeIngredient } from "./test-helpers";

/**
 * PantryManager behavior (spec 13, T5; PROMTP #41).
 *
 * The container is exercised against a mocked Server Actions module: the tests
 * assert that it calls the actions with the right serializable payloads and
 * reconciles its local view after each mutation, plus the empty/confirmation
 * flows. Real `IngredientSearch` and `PantryList` are rendered on purpose so the
 * test covers the wiring, not just isolated props.
 */

vi.mock("@/app/dashboard/pantry/actions", () => ({
  searchIngredientsAction: vi.fn(),
  addPantryIngredientAction: vi.fn(),
  updatePantryIngredientAction: vi.fn(),
  removePantryIngredientAction: vi.fn(),
  clearUserPantryAction: vi.fn(),
}));

const searchMock = vi.mocked(searchIngredientsAction);
const addMock = vi.mocked(addPantryIngredientAction);
const updateMock = vi.mocked(updatePantryIngredientAction);
const removeMock = vi.mocked(removePantryIngredientAction);
const clearMock = vi.mocked(clearUserPantryAction);

const tomate: PantryItemData = {
  id: "ing-tomate",
  name: "Tomate",
  quantity: 3,
  unit: "unidades",
};
const cebolla: PantryItemData = {
  id: "ing-cebolla",
  name: "Cebolla",
  quantity: 1,
  unit: "unidad",
};

beforeEach(() => {
  vi.clearAllMocks();
  searchMock.mockResolvedValue([]);
  addMock.mockResolvedValue({ ok: true });
  updateMock.mockResolvedValue({ ok: true });
  removeMock.mockResolvedValue({ ok: true });
  clearMock.mockResolvedValue({ ok: true });
});

describe("PantryManager", () => {
  it("adds an ingredient by selecting a search result", async () => {
    const user = userEvent.setup();
    searchMock.mockResolvedValue([makeIngredient({ id: "ing-papa", name: "Papa" })]);

    render(<PantryManager initialItems={[]} />);

    await user.type(screen.getByRole("combobox"), "papa");
    await user.click(await screen.findByRole("option", { name: "Papa" }));

    await waitFor(() =>
      expect(addMock).toHaveBeenCalledWith({
        ingredientId: "ing-papa",
        quantity: 1,
        unit: "unidad",
      }),
    );
    expect(await screen.findByText("Papa")).toBeInTheDocument();
  });

  it("persists an edited quantity and unit", async () => {
    const user = userEvent.setup();
    render(<PantryManager initialItems={[tomate]} />);

    await user.click(
      screen.getByRole("button", {
        name: `${messages.pantry.edit}: ${tomate.name}`,
      }),
    );

    const quantity = screen.getByLabelText(messages.pantry.quantity);
    const unit = screen.getByLabelText(messages.pantry.unit);
    await user.clear(quantity);
    await user.type(quantity, "5");
    await user.clear(unit);
    await user.type(unit, "kg");
    await user.click(screen.getByRole("button", { name: messages.pantry.save }));

    await waitFor(() =>
      expect(updateMock).toHaveBeenCalledWith({
        ingredientId: "ing-tomate",
        quantity: 5,
        unit: "kg",
      }),
    );
  });

  it("removes an ingredient from the list", async () => {
    const user = userEvent.setup();
    render(<PantryManager initialItems={[tomate]} />);

    await user.click(
      screen.getByRole("button", {
        name: `${messages.pantry.remove}: ${tomate.name}`,
      }),
    );

    await waitFor(() =>
      expect(removeMock).toHaveBeenCalledWith({ ingredientId: "ing-tomate" }),
    );
    await waitFor(() =>
      expect(screen.queryByText("Tomate")).not.toBeInTheDocument(),
    );
  });

  it("clears the pantry only after an explicit confirmation", async () => {
    const user = userEvent.setup();
    render(<PantryManager initialItems={[tomate, cebolla]} />);

    await user.click(
      screen.getByRole("button", { name: messages.pantry.clear }),
    );

    // First click only reveals the confirmation; it must not mutate.
    expect(clearMock).not.toHaveBeenCalled();
    expect(screen.getByText(messages.pantry.clearConfirm)).toBeInTheDocument();

    await user.click(
      screen.getByRole("button", { name: messages.pantry.clear }),
    );

    await waitFor(() => expect(clearMock).toHaveBeenCalledTimes(1));
    await waitFor(() =>
      expect(screen.getByText(messages.pantry.emptyTitle)).toBeInTheDocument(),
    );
  });

  it("shows a friendly empty state when the pantry is empty", () => {
    render(<PantryManager initialItems={[]} />);

    expect(screen.getByText(messages.pantry.emptyTitle)).toBeInTheDocument();
    expect(
      screen.getByText(messages.pantry.emptyDescription),
    ).toBeInTheDocument();
    expect(
      screen.getByRole("button", { name: messages.pantry.clear }),
    ).toBeDisabled();
  });

  it("surfaces the action message when a mutation fails", async () => {
    const user = userEvent.setup();
    addMock.mockResolvedValue({ ok: false, message: "No se pudo guardar." });
    searchMock.mockResolvedValue([makeIngredient({ id: "ing-papa", name: "Papa" })]);

    render(<PantryManager initialItems={[]} />);

    await user.type(screen.getByRole("combobox"), "papa");
    await user.click(await screen.findByRole("option", { name: "Papa" }));

    const alert = await screen.findByRole("alert");
    expect(alert).toHaveTextContent("No se pudo guardar.");
  });
});
