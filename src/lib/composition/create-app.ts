import type { Logger } from "@/application/ports/logger";
import { createConsoleLogger } from "@/infrastructure/logging/console-logger";

/**
 * Composition root (REQ-08): the ONLY place where adapters are wired into
 * the application. No DI framework — plain functions and explicit arguments.
 *
 * Future specs (03–05) extend `AppServices` with their concrete chain,
 * which follows the documented example:
 *
 *   SupabaseRecipeRepository + GeminiRecipeProvider        (infrastructure)
 *     → RecipeRecommendationService                        (application)
 *     → FindRecipesFromPantry use case                     (application)
 *
 * Tests instantiate the same root with fake ports injected instead of the
 * real adapters (ISSUE test case 3).
 */

export interface AppServices {
  logger: Logger;
}

export interface CreateAppOptions {
  /** Injected logger; defaults to the console adapter. */
  logger?: Logger;
}

export function createApp(options: CreateAppOptions = {}): AppServices {
  const logger = options.logger ?? createConsoleLogger();
  return { logger };
}
