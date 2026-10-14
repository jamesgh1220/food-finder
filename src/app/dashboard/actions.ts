"use server";

import { z } from "zod";
import type { GeneratedRecipe } from "@/application/ports/external-recipe-prompt-provider";
import { RECIPE_PROMPT_MAX_LENGTH } from "@/application/recipes/generate-recipe-from-prompt";
import { UnauthorizedError, ValidationError } from "@/domain/errors";
import { createServerApplicationServices } from "@/lib/composition/server-application";
import { messages } from "@/lib/i18n/messages";

/**
 * Chef Server Action (misma disciplina que pantry/favorites).
 *
 * Punto de entrada no confiable: valida su forma con zod, deriva la identidad
 * de la sesión dentro del caso de uso (que lanza `UnauthorizedError` sin
 * sesión) y devuelve un resultado serializable discriminado. No llama a
 * `refresh()`: el resultado se consume inline, no re-renderiza la ruta.
 *
 * El proveedor degrada a `null` en lugar de lanzar, así que `ok: false` cubre
 * tanto la ausencia de receta como los fallos de dominio.
 */

export type GenerateRecipeResult =
  | { ok: true; recipe: GeneratedRecipe }
  | { ok: false; message: string };

const promptInputSchema = z.object({
  prompt: z.string().trim().min(1).max(RECIPE_PROMPT_MAX_LENGTH),
});

export async function generateRecipeAction(input: {
  prompt: string;
}): Promise<GenerateRecipeResult> {
  const parsed = promptInputSchema.safeParse(input);
  if (!parsed.success) {
    return { ok: false, message: messages.chef.invalidPrompt };
  }

  const services = await createServerApplicationServices();
  try {
    const recipe = await services.generateRecipeFromPrompt.execute({
      prompt: parsed.data.prompt,
    });

    if (!recipe) {
      return { ok: false, message: messages.chef.errorDescription };
    }

    return { ok: true, recipe };
  } catch (error) {
    if (error instanceof UnauthorizedError) {
      return { ok: false, message: messages.chef.unauthorized };
    }
    if (error instanceof ValidationError) {
      return { ok: false, message: messages.chef.invalidPrompt };
    }
    return { ok: false, message: messages.chef.errorDescription };
  }
}
