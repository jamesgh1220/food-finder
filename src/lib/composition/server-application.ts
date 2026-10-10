import { createConsoleLogger } from "@/infrastructure/logging/console-logger";
import { createSupabaseServerClient } from "@/infrastructure/supabase/client/server-client";
import { createSupabaseAuthPort } from "@/infrastructure/auth/supabase-auth-port";
import { createSupabaseRepositories } from "@/infrastructure/supabase/repositories";
import { createGeminiRecipeProvider } from "@/infrastructure/gemini/providers";
import { createRecipeRecommendationService } from "@/application/recipes/create-recipe-recommendation-service";
import { createApplicationServices, type ApplicationServices } from "@/lib/composition/application";

export async function createServerApplicationServices(): Promise<ApplicationServices> {
  const client = await createSupabaseServerClient();
  const logger = createConsoleLogger();

  const repositories = createSupabaseRepositories({ client });

  const auth = createSupabaseAuthPort(client);

  const geminiProvider = createGeminiRecipeProvider({
    logger,
    cuisineRepository: repositories.cuisines,
    recipeRepository: repositories.recipes,
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
  });
}
