import { describe, expect, it } from "vitest";
import {
  GeminiRecipesResponseSchema,
  GeminiRecipeSchema,
} from "@/infrastructure/gemini/schemas";

/** Receta válida base; cada test sobrescribe solo lo que necesita (REQ-10). */
function validRecipe(overrides: Record<string, unknown> = {}) {
  return {
    name: "Tortilla de patatas",
    description: "Clásica española",
    cuisine: "Española",
    mealType: "DINNER",
    ingredients: [{ name: "Patata", quantity: 4, unit: "unidad" }],
    instructions: ["Pelar las patatas.", "Freír y cuajar."],
    preparationTimeMinutes: 30,
    servings: 4,
    difficulty: "EASY",
    ...overrides,
  };
}

describe("GeminiRecipeSchema", () => {
  it("acepta una receta válida", () => {
    const result = GeminiRecipeSchema.safeParse(validRecipe());
    expect(result.success).toBe(true);
  });

  it("rechaza una receta sin nombre", () => {
    const result = GeminiRecipeSchema.safeParse(validRecipe({ name: "" }));
    expect(result.success).toBe(false);
  });

  it("rechaza una lista de ingredientes vacía", () => {
    const result = GeminiRecipeSchema.safeParse(
      validRecipe({ ingredients: [] }),
    );
    expect(result.success).toBe(false);
  });

  it("rechaza una lista de pasos vacía", () => {
    const result = GeminiRecipeSchema.safeParse(
      validRecipe({ instructions: [] }),
    );
    expect(result.success).toBe(false);
  });

  it("rechaza un paso vacío", () => {
    const result = GeminiRecipeSchema.safeParse(
      validRecipe({ instructions: ["Paso válido", ""] }),
    );
    expect(result.success).toBe(false);
  });

  it("rechaza una cantidad no numérica", () => {
    const result = GeminiRecipeSchema.safeParse(
      validRecipe({
        ingredients: [{ name: "Patata", quantity: "cuatro", unit: "unidad" }],
      }),
    );
    expect(result.success).toBe(false);
  });

  it("rechaza un mealType fuera del catálogo", () => {
    const result = GeminiRecipeSchema.safeParse(
      validRecipe({ mealType: "BRUNCH" }),
    );
    expect(result.success).toBe(false);
  });

  it("acepta cantidad y unidad nulas", () => {
    const result = GeminiRecipeSchema.safeParse(
      validRecipe({
        ingredients: [{ name: "Sal", quantity: null, unit: null }],
      }),
    );
    expect(result.success).toBe(true);
  });
});

describe("GeminiRecipesResponseSchema", () => {
  it("acepta el sobre con un arreglo de recetas", () => {
    const result = GeminiRecipesResponseSchema.safeParse({
      recipes: [validRecipe()],
    });
    expect(result.success).toBe(true);
  });

  it("no tumba el lote completo por una receta inválida (validación por ítem)", () => {
    const result = GeminiRecipesResponseSchema.safeParse({
      recipes: [validRecipe(), { name: "" }],
    });
    // El sobre solo valida la forma; el proveedor descarta ítems inválidos.
    expect(result.success).toBe(true);
  });

  it("rechaza una respuesta sin el arreglo recipes", () => {
    const result = GeminiRecipesResponseSchema.safeParse({ foo: "bar" });
    expect(result.success).toBe(false);
  });
});
