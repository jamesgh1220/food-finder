import type { NextRequest } from "next/server";
import type { ApplicationServices } from "@/lib/composition/application";
import { apiSuccess } from "@/lib/api/envelope";
import { withErrorBoundary } from "@/lib/api/http";
import { serializeCuisine } from "@/lib/api/serializers";

export function listCuisines(
  _request: NextRequest,
  services: ApplicationServices,
): Promise<Response> {
  return withErrorBoundary(async () => {
    const cuisines = await services.getCuisines.execute();
    return Response.json(apiSuccess(cuisines.map(serializeCuisine)));
  });
}
