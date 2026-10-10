import type { NextRequest } from "next/server";
import type { ApplicationServices } from "@/lib/composition/application";
import { apiSuccess } from "@/lib/api/envelope";
import { withErrorBoundary } from "@/lib/api/http";
import { serializeIngredient } from "@/lib/api/serializers";
import {
  ingredientsQuerySchema,
  ingredientsSearchQuerySchema,
} from "@/lib/api/schemas";
import { parseOrThrow } from "@/lib/api/validation";

export function listIngredients(
  request: NextRequest,
  services: ApplicationServices,
): Promise<Response> {
  return withErrorBoundary(async () => {
    const searchParams = new URL(request.url).searchParams;
    const input = parseOrThrow(ingredientsQuerySchema, {
      search: searchParams.get("search") || undefined,
    });
    const ingredients = await services.searchIngredients.execute({
      query: input.search,
    });
    return Response.json(apiSuccess(ingredients.map(serializeIngredient)));
  });
}

export function searchIngredients(
  request: NextRequest,
  services: ApplicationServices,
): Promise<Response> {
  return withErrorBoundary(async () => {
    const searchParams = new URL(request.url).searchParams;
    const input = parseOrThrow(ingredientsSearchQuerySchema, {
      query: searchParams.get("query") || searchParams.get("q") || undefined,
    });
    const ingredients = await services.searchIngredients.execute({
      query: input.query,
    });
    return Response.json(apiSuccess(ingredients.map(serializeIngredient)));
  });
}
