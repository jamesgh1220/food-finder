import { act, render, screen } from "@testing-library/react";
import userEvent from "@testing-library/user-event";
import { beforeEach, describe, expect, it, vi } from "vitest";
import type { GenerateRecipeResult } from "@/app/dashboard/actions";
import { PromptRecipeForm } from "@/components/dashboard/prompt-recipe-form";
import type { GeneratedRecipe } from "@/application/ports/external-recipe-prompt-provider";
import { messages } from "@/lib/i18n/messages";

/**
 * PromptRecipeForm (dashboard chef tab).
 *
 * Client container between the free-text request and `generateRecipeAction`.
 * The server actions module is mocked — importing the real one in jsdom would
 * pull the composition root — and the favorites actions are mocked too because
 * the inline result mounts `FavoriteToggle`. The generated recipe must render
 * inline (never a redirect): the recipe row is persisted without its ingredient
 * rows, so the validated action payload is the only complete source.
 */

const mocks = vi.hoisted(() => ({
  generateRecipeAction: vi.fn(),
  addFavoriteAction: vi.fn(),
  removeFavoriteAction: vi.fn(),
}));

vi.mock("@/app/dashboard/actions", () => ({
  generateRecipeAction: mocks.generateRecipeAction,
}));

vi.mock("@/app/dashboard/favorites/actions", () => ({
  addFavoriteAction: mocks.addFavoriteAction,
  removeFavoriteAction: mocks.removeFavoriteAction,
}));

const RECIPE: GeneratedRecipe = {
  id: "recipe-1",
  name: "Arroz a la cubana",
  description: "Un clásico rápido",
  cuisineName: "Española",
  mealType: "LUNCH",
  difficulty: "EASY",
  preparationTimeMinutes: 25,
  servings: 2,
  ingredients: [
    { name: "Arroz", quantity: 200, unit: "g", optional: false },
    { name: "Huevo", quantity: null, unit: null, optional: true },
  ],
  instructions: ["Cocer el arroz.", "Freír los huevos."],
  source: "AI_GENERATED",
};

beforeEach(() => {
  vi.clearAllMocks();
  mocks.generateRecipeAction.mockResolvedValue({ ok: true, recipe: RECIPE });
  mocks.addFavoriteAction.mockResolvedValue({ ok: true });
  mocks.removeFavoriteAction.mockResolvedValue({ ok: true });
});

describe("PromptRecipeForm", () => {
  it("keeps submit disabled until the prompt has content", async () => {
    const user = userEvent.setup();
    render(<PromptRecipeForm />);

    const submit = screen.getByRole("button", {
      name: messages.chef.submit,
    });
    expect(submit).toBeDisabled();

    await user.type(screen.getByLabelText(messages.chef.promptLabel), "Arroz");

    expect(submit).toBeEnabled();
  });

  it("sends the trimmed prompt and renders the recipe inline", async () => {
    const user = userEvent.setup();
    render(<PromptRecipeForm />);

    await user.type(
      screen.getByLabelText(messages.chef.promptLabel),
      "  Tengo arroz y huevos  ",
    );
    await user.click(screen.getByRole("button", { name: messages.chef.submit }));

    expect(mocks.generateRecipeAction).toHaveBeenCalledWith({
      prompt: "Tengo arroz y huevos",
    });

    expect(await screen.findByText(RECIPE.name)).toBeInTheDocument();
    expect(screen.getByText("Arroz")).toBeInTheDocument();
    expect(screen.getByText("Cocer el arroz.")).toBeInTheDocument();
    expect(
      screen.getByRole("button", {
        name: `${messages.favorites.add}: ${RECIPE.name}`,
      }),
    ).toBeInTheDocument();
  });

  it("shows the message returned by the action when no recipe is produced", async () => {
    const user = userEvent.setup();
    mocks.generateRecipeAction.mockResolvedValue({
      ok: false,
      message: messages.chef.errorDescription,
    });

    render(<PromptRecipeForm />);

    await user.type(screen.getByLabelText(messages.chef.promptLabel), "Arroz");
    await user.click(screen.getByRole("button", { name: messages.chef.submit }));

    expect(await screen.findByRole("alert")).toHaveTextContent(
      messages.chef.errorDescription,
    );
  });

  it("falls back to a generic message when the action rejects", async () => {
    const user = userEvent.setup();
    mocks.generateRecipeAction.mockRejectedValue(new Error("boom"));

    render(<PromptRecipeForm />);

    await user.type(screen.getByLabelText(messages.chef.promptLabel), "Arroz");
    await user.click(screen.getByRole("button", { name: messages.chef.submit }));

    expect(await screen.findByRole("alert")).toHaveTextContent(
      messages.chef.errorDescription,
    );
  });

  it("announces a loading state while the recipe is being generated", async () => {
    const user = userEvent.setup();
    let resolveAction: (value: GenerateRecipeResult) => void = () => {};
    mocks.generateRecipeAction.mockImplementation(
      () =>
        new Promise<GenerateRecipeResult>((resolve) => {
          resolveAction = resolve;
        }),
    );

    render(<PromptRecipeForm />);

    await user.type(screen.getByLabelText(messages.chef.promptLabel), "Arroz");
    await user.click(screen.getByRole("button", { name: messages.chef.submit }));

    expect(await screen.findByText(messages.chef.loading)).toBeInTheDocument();

    await act(async () => {
      resolveAction({ ok: true, recipe: RECIPE });
    });

    expect(await screen.findByText(RECIPE.name)).toBeInTheDocument();
    expect(screen.queryByText(messages.chef.loading)).not.toBeInTheDocument();
  });
});
