/**
 * Barril del adaptador de Gemini (spec 09).
 *
 * Expone la factoría del proveedor junto con los tipos del cliente y los
 * schemas para que la composition root dependa de `@/infrastructure/gemini`
 * sin conocer la estructura interna de carpetas.
 */
export { createGeminiRecipeProvider } from "./providers";
export type { GeminiRecipeProviderOptions } from "./providers";

export {
  createGeminiClient,
  GeminiClientError,
  DEFAULT_GEMINI_MODEL,
  DEFAULT_GEMINI_BASE_URL,
  DEFAULT_GEMINI_TIMEOUT_MS,
  DEFAULT_GEMINI_MAX_RETRIES,
  GEMINI_CLIENT_ERROR_CODES,
} from "./client/gemini-client";
export type {
  GeminiClient,
  GeminiClientOptions,
  GeminiClientErrorCode,
} from "./client/gemini-client";

export {
  GeminiRecipeSchema,
  GeminiRecipesResponseSchema,
  geminiResponseSchema,
} from "./schemas";
export type { GeminiRecipe, GeminiRecipesResponse } from "./schemas";
