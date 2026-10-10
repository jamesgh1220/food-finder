import type { NextRequest } from "next/server";
import { createServerApplicationServices } from "@/lib/composition/server-application";
import { withErrorBoundary } from "@/lib/api/http";
import { searchIngredients } from "@/lib/api/handlers/ingredients";

export async function GET(request: NextRequest) {
  return withErrorBoundary(async () => {
    const services = await createServerApplicationServices();
    return searchIngredients(request, services);
  });
}
