import type { NextRequest } from "next/server";
import type { ApplicationServices } from "@/lib/composition/application";
import { apiSuccess } from "@/lib/api/envelope";
import { withErrorBoundary } from "@/lib/api/http";
import { serializeRecipe } from "@/lib/api/serializers";
import { recipesQuerySchema, recipeParamsSchema } from "@/lib/api/schemas";
import { parseOrThrow } from "@/lib/api/validation";

export function listRecipes(
  request: NextRequest,
  services: ApplicationServices,
): Promise<Response> {
  return withErrorBoundary(async () => {
    const searchParams = new URL(request.url).searchParams;
    const input = parseOrThrow(recipesQuerySchema, {
      search: searchParams.get("search") || undefined,
      mealType: searchParams.get("mealType") || undefined,
      cuisineId: searchParams.get("cuisineId") || undefined,
    });
    const recipes = await services.searchRecipes.execute(input);
    return Response.json(apiSuccess(recipes.map(serializeRecipe)));
  });
}

export function getRecipe(
  params: { id: string },
  services: ApplicationServices,
): Promise<Response> {
  return withErrorBoundary(async () => {
    const input = parseOrThrow(recipeParamsSchema, params);
    const recipe = await services.getRecipeById.execute(input);
    return Response.json(apiSuccess(serializeRecipe(recipe)));
  });
}
