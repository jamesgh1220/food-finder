import type { NextRequest } from "next/server";
import type { ApplicationServices } from "@/lib/composition/application";
import { apiSuccess } from "@/lib/api/envelope";
import { withErrorBoundary } from "@/lib/api/http";
import { serializeRecommendedRecipe } from "@/lib/api/serializers";
import { recommendationsBodySchema } from "@/lib/api/schemas";
import { parseOrThrow } from "@/lib/api/validation";

export function createRecommendation(
  request: NextRequest,
  services: ApplicationServices,
): Promise<Response> {
  return withErrorBoundary(async () => {
    const body = await request.json();
    const input = parseOrThrow(recommendationsBodySchema, body);
    const results = await services.findRecipesFromPantry.execute({
      ingredientIds: input.ingredientIds,
      mealType: input.mealType,
      cuisineId: input.cuisineId,
    });
    return Response.json(apiSuccess(results.map(serializeRecommendedRecipe)));
  });
}
