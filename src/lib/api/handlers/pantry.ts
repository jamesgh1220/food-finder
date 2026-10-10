import type { NextRequest } from "next/server";
import type { ApplicationServices } from "@/lib/composition/application";
import { apiSuccess } from "@/lib/api/envelope";
import { withErrorBoundary } from "@/lib/api/http";
import { serializePantryItem } from "@/lib/api/serializers";
import {
  pantryAddBodySchema,
  pantryUpdateBodySchema,
  pantryItemParamsSchema,
} from "@/lib/api/schemas";
import { parseOrThrow } from "@/lib/api/validation";

export function listPantry(
  _request: NextRequest,
  services: ApplicationServices,
): Promise<Response> {
  return withErrorBoundary(async () => {
    const items = await services.getUserPantry.execute();
    return Response.json(apiSuccess(items.map(serializePantryItem)));
  });
}

export function addPantryItem(
  request: NextRequest,
  services: ApplicationServices,
): Promise<Response> {
  return withErrorBoundary(async () => {
    const body = await request.json();
    const input = parseOrThrow(pantryAddBodySchema, body);
    const item = await services.addPantryIngredient.execute(input);
    return Response.json(apiSuccess(serializePantryItem(item)), { status: 201 });
  });
}

export function updatePantryItem(
  request: NextRequest,
  services: ApplicationServices,
  params: { id: string },
): Promise<Response> {
  return withErrorBoundary(async () => {
    const body = await request.json();
    const { id } = parseOrThrow(pantryItemParamsSchema, params);
    const input = parseOrThrow(pantryUpdateBodySchema, body);
    const item = await services.updatePantryIngredient.execute({
      ingredientId: id,
      quantity: input.quantity,
      unit: input.unit,
    });
    return Response.json(apiSuccess(serializePantryItem(item)));
  });
}

export function removePantryItem(
  _request: NextRequest,
  services: ApplicationServices,
  params: { id: string },
): Promise<Response> {
  return withErrorBoundary(async () => {
    const input = parseOrThrow(pantryItemParamsSchema, params);
    await services.removePantryIngredient.execute({ ingredientId: input.id });
    return Response.json(apiSuccess({}));
  });
}
