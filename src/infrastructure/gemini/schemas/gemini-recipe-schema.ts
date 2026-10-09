import { z } from "zod";
import { MEAL_TYPES } from "@/domain/value-objects";

/**
 * Schema de validación de la salida de Gemini (spec 09, REQ-06/REQ-10).
 *
 * Frontera del pipeline `Respuesta Gemini → Schema Zod → Mapper → Domain model`:
 * todo lo que produce el modelo pasa por aquí antes de tocar el dominio. Cada
 * receta se valida de forma estricta (campos obligatorios, al menos un
 * ingrediente, al menos un paso, cantidades numéricas positivas), pero un
 * elemento inválido NO invalida el lote completo: el proveedor descarta los
 * elementos que no pasan y conserva los válidos (REQ-10).
 */

const GeminiIngredientSchema = z.object({
  name: z.string().trim().min(1),
  quantity: z.number().positive().nullable(),
  unit: z.string().trim().min(1).nullable(),
  optional: z.boolean().optional(),
});

const GeminiDifficultySchema = z
  .enum(["EASY", "MEDIUM", "HARD"])
  .nullable()
  .optional();

/** Una receta individual generada por Gemini, ya validada. */
export const GeminiRecipeSchema = z.object({
  name: z.string().trim().min(1),
  description: z.string().nullable().optional(),
  cuisine: z.string().trim().min(1),
  mealType: z.enum(MEAL_TYPES),
  ingredients: z.array(GeminiIngredientSchema).min(1),
  instructions: z.array(z.string().trim().min(1)).min(1),
  preparationTimeMinutes: z.number().int().positive(),
  servings: z.number().int().positive(),
  difficulty: GeminiDifficultySchema,
});

/**
 * Sobre de la respuesta: valida solo la forma `{ recipes: unknown[] }`.
 *
 * A propósito NO valida cada receta aquí: el proveedor valida ítem por ítem
 * con `GeminiRecipeSchema` para que una receta inválida no descarte el lote
 * completo (REQ-10).
 */
export const GeminiRecipesResponseSchema = z.object({
  recipes: z.array(z.unknown()),
});

export type GeminiRecipe = z.infer<typeof GeminiRecipeSchema>;
export type GeminiRecipesResponse = z.infer<typeof GeminiRecipesResponseSchema>;

/**
 * JSON Schema (borrador aceptado por Gemini) que acompaña a
 * `responseMimeType: "application/json"` para pedir salida estructurada.
 *
 * Es best-effort: solo guía al modelo. La validación real la hace Zod.
 */
export const geminiResponseSchema: Record<string, unknown> = {
  type: "object",
  properties: {
    recipes: {
      type: "array",
      items: {
        type: "object",
        properties: {
          name: { type: "string" },
          description: { type: "string", nullable: true },
          cuisine: { type: "string" },
          mealType: { type: "string", enum: [...MEAL_TYPES] },
          ingredients: {
            type: "array",
            items: {
              type: "object",
              properties: {
                name: { type: "string" },
                quantity: { type: "number", nullable: true },
                unit: { type: "string", nullable: true },
                optional: { type: "boolean" },
              },
              required: ["name"],
            },
          },
          instructions: { type: "array", items: { type: "string" } },
          preparationTimeMinutes: { type: "integer" },
          servings: { type: "integer" },
          difficulty: {
            type: "string",
            enum: ["EASY", "MEDIUM", "HARD"],
            nullable: true,
          },
        },
        required: [
          "name",
          "cuisine",
          "mealType",
          "ingredients",
          "instructions",
          "preparationTimeMinutes",
          "servings",
        ],
      },
    },
  },
  required: ["recipes"],
};
