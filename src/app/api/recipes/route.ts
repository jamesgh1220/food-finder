import type { NextRequest } from "next/server";
import { createServerApplicationServices } from "@/lib/composition/server-application";
import { withErrorBoundary } from "@/lib/api/http";
import { listRecipes } from "@/lib/api/handlers/recipes";

export async function GET(request: NextRequest) {
  return withErrorBoundary(async () => {
    const services = await createServerApplicationServices();
    return listRecipes(request, services);
  });
}
