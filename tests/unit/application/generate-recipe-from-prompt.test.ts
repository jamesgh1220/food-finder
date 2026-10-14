import { describe, expect, it, vi } from "vitest";
import type { Mock } from "vitest";
import type {
  ExternalRecipePromptProvider,
  GeneratedRecipe,
} from "@/application/ports/external-recipe-prompt-provider";
import {
  GenerateRecipeFromPrompt,
  RECIPE_PROMPT_MAX_LENGTH,
} from "@/application/recipes/generate-recipe-from-prompt";
import { UnauthorizedError, ValidationError } from "@/domain/errors";
import { createFakeAuthPort } from "./helpers";

/**
 * GenerateRecipeFromPrompt (chef flow).
 *
 * The use case only governs the boundary: it requires a session, validates the
 * free text and delegates to the prompt port. The provider is faked, so no
 * network or Gemini client is involved. Degradation (`null`) is the provider's
 * contract; the use case must not turn it into an error.
 */

function makeGeneratedRecipe(
  overrides: Partial<GeneratedRecipe> = {},
): GeneratedRecipe {
  return {
    id: "recipe-1",
    name: "Arroz a la cubana",
    description: "Un clásico rápido",
    cuisineName: "Española",
    mealType: "LUNCH",
    difficulty: "EASY",
    preparationTimeMinutes: 25,
    servings: 2,
    ingredients: [{ name: "Arroz", quantity: 200, unit: "g", optional: false }],
    instructions: ["Cocer el arroz.", "Freír los huevos."],
    source: "AI_GENERATED",
    ...overrides,
  };
}

function createFakeProvider(result: GeneratedRecipe | null = makeGeneratedRecipe()): {
  provider: ExternalRecipePromptProvider;
  generateFromPrompt: Mock;
} {
  const generateFromPrompt = vi.fn(async () => result);
  return { provider: { generateFromPrompt }, generateFromPrompt };
}

describe("GenerateRecipeFromPrompt", () => {
  it("exige sesión antes de llamar al proveedor", async () => {
    const { provider, generateFromPrompt } = createFakeProvider();
    const useCase = new GenerateRecipeFromPrompt(
      provider,
      createFakeAuthPort(null),
    );

    await expect(useCase.execute({ prompt: "Tengo arroz" })).rejects.toBeInstanceOf(
      UnauthorizedError,
    );
    expect(generateFromPrompt).not.toHaveBeenCalled();
  });

  it("rechaza una petición vacía o en blanco", async () => {
    const { provider, generateFromPrompt } = createFakeProvider();
    const useCase = new GenerateRecipeFromPrompt(provider, createFakeAuthPort());

    await expect(useCase.execute({ prompt: "   " })).rejects.toBeInstanceOf(
      ValidationError,
    );
    expect(generateFromPrompt).not.toHaveBeenCalled();
  });

  it("rechaza una petición más larga que el límite", async () => {
    const { provider, generateFromPrompt } = createFakeProvider();
    const useCase = new GenerateRecipeFromPrompt(provider, createFakeAuthPort());

    await expect(
      useCase.execute({ prompt: "a".repeat(RECIPE_PROMPT_MAX_LENGTH + 1) }),
    ).rejects.toBeInstanceOf(ValidationError);
    expect(generateFromPrompt).not.toHaveBeenCalled();
  });

  it("recorta el texto y delega en el proveedor", async () => {
    const recipe = makeGeneratedRecipe();
    const { provider, generateFromPrompt } = createFakeProvider(recipe);
    const useCase = new GenerateRecipeFromPrompt(provider, createFakeAuthPort());

    await expect(
      useCase.execute({ prompt: "  Tengo arroz y huevos  " }),
    ).resolves.toEqual(recipe);
    expect(generateFromPrompt).toHaveBeenCalledWith({
      prompt: "Tengo arroz y huevos",
    });
  });

  it("devuelve null cuando el proveedor no genera ninguna receta", async () => {
    const { provider } = createFakeProvider(null);
    const useCase = new GenerateRecipeFromPrompt(provider, createFakeAuthPort());

    await expect(useCase.execute({ prompt: "Tengo arroz" })).resolves.toBeNull();
  });
});
