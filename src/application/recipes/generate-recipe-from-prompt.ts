import type { AuthPort } from "@/application/ports/auth";
import type {
  ExternalRecipePromptProvider,
  GeneratedRecipe,
} from "@/application/ports/external-recipe-prompt-provider";
import { requireAuthenticatedUser } from "@/application/shared/require-authenticated-user";
import { ValidationError } from "@/domain/errors";

/**
 * Caso de uso GenerateRecipeFromPrompt.
 *
 * El usuario describe en lenguaje natural qué ingredientes tiene y qué quiere
 * cocinar; el proveedor externo (Gemini) responde como chef con una receta
 * completa. Este caso de uso solo gobierna la frontera: exige sesión, valida el
 * texto y delega. No conoce a Gemini ni toca la red.
 *
 * El proveedor degrada a `null` en lugar de lanzar (ver
 * `ExternalRecipePromptProvider`), así que `execute` devuelve `null` cuando no
 * hubo receta y la UI decide el mensaje.
 */

/** Límite defensivo del texto aceptado (el modelo no necesita más). */
export const RECIPE_PROMPT_MAX_LENGTH = 1000;

export interface GenerateRecipeFromPromptInput {
  prompt: string;
}

export class GenerateRecipeFromPrompt {
  constructor(
    private readonly provider: ExternalRecipePromptProvider,
    private readonly auth: AuthPort,
  ) {}

  async execute(
    input: GenerateRecipeFromPromptInput,
  ): Promise<GeneratedRecipe | null> {
    await requireAuthenticatedUser(this.auth);

    const prompt = input?.prompt?.trim() ?? "";
    if (prompt.length === 0) {
      throw new ValidationError("Escribe qué quieres cocinar.");
    }
    if (prompt.length > RECIPE_PROMPT_MAX_LENGTH) {
      throw new ValidationError(
        `La petición no puede superar los ${RECIPE_PROMPT_MAX_LENGTH} caracteres.`,
      );
    }

    return this.provider.generateFromPrompt({ prompt });
  }
}
