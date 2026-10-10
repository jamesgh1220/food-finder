import type { NextRequest } from "next/server";
import type { ApplicationServices } from "@/lib/composition/application";
import { apiSuccess } from "@/lib/api/envelope";
import { withErrorBoundary } from "@/lib/api/http";
import { serializeRecipe } from "@/lib/api/serializers";
import { favoriteAddBodySchema, favoriteParamsSchema } from "@/lib/api/schemas";
import { parseOrThrow } from "@/lib/api/validation";

export function listFavorites(
  _request: NextRequest,
  services: ApplicationServices,
): Promise<Response> {
  return withErrorBoundary(async () => {
    const recipes = await services.getFavoriteRecipes.execute();
    return Response.json(apiSuccess(recipes.map(serializeRecipe)));
  });
}

export function addFavorite(
  request: NextRequest,
  services: ApplicationServices,
): Promise<Response> {
  return withErrorBoundary(async () => {
    const body = await request.json();
    const input = parseOrThrow(favoriteAddBodySchema, body);
    await services.addFavoriteRecipe.execute(input);
    return Response.json(apiSuccess({}), { status: 201 });
  });
}

export function removeFavorite(
  _request: NextRequest,
  services: ApplicationServices,
  params: { recipeId: string },
): Promise<Response> {
  return withErrorBoundary(async () => {
    const input = parseOrThrow(favoriteParamsSchema, params);
    await services.removeFavoriteRecipe.execute({ recipeId: input.recipeId });
    return Response.json(apiSuccess({}));
  });
}
