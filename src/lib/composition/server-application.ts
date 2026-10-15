import { createConsoleLogger } from "@/infrastructure/logging/console-logger";
import { createSupabaseServerClient } from "@/infrastructure/supabase/client/server-client";
import { createSupabaseAdminClient } from "@/infrastructure/supabase/client/admin-client";
import { createSupabaseAuthPort } from "@/infrastructure/auth/supabase-auth-port";
import { createSupabaseRepositories } from "@/infrastructure/supabase/repositories";
import { createGeminiRecipeProvider } from "@/infrastructure/gemini/providers";
import { createRecipeRecommendationService } from "@/application/recipes/create-recipe-recommendation-service";
import { createApplicationServices, type ApplicationServices } from "@/lib/composition/application";

export async function createServerApplicationServices(): Promise<ApplicationServices> {
  const client = await createSupabaseServerClient();
  const logger = createConsoleLogger();

  // El cliente admin (service-role) es necesario para dos operaciones
  // privilegiadas: Auth Admin y persistir recetas generadas por IA. El catálogo
  // `recipes` es de solo lectura para los usuarios bajo RLS (spec 04 REQ-04),
  // pero el servidor debe persistir estas recetas para asignarles un id estable
  // (spec 09 REQ-07). Solo se usa en servidor: `createServerApplicationServices`
  // únicamente se importa desde Server Components, Server Actions y Route
  // Handlers.
  const adminClient = createSupabaseAdminClient();

  const repositories = createSupabaseRepositories({ client, adminClient, logger });

  const auth = createSupabaseAuthPort(client);

  const geminiProvider = createGeminiRecipeProvider({
    logger,
    cuisineRepository: repositories.cuisines,
    recipeRepository: repositories.recipeWriter,
    apiKey: process.env.GEMINI_API_KEY,
    model: process.env.GEMINI_MODEL,
    baseUrl: process.env.GEMINI_BASE_URL,
  });

  const recommendations = createRecipeRecommendationService({
    catalog: repositories.recommendationCatalog,
    ingredients: repositories.ingredients,
    cuisines: repositories.cuisines,
    externalProvider: geminiProvider,
  });

  return createApplicationServices({
    auth,
    pantry: repositories.pantry,
    recipes: repositories.recipes,
    cuisines: repositories.cuisines,
    favorites: repositories.favorites,
    recommendations,
    ingredients: repositories.ingredients,
    externalPromptProvider: geminiProvider,
  });
}
