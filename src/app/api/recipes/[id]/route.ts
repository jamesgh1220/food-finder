import type { NextRequest } from "next/server";
import { createServerApplicationServices } from "@/lib/composition/server-application";
import { withErrorBoundary } from "@/lib/api/http";
import { getRecipe } from "@/lib/api/handlers/recipes";

export async function GET(
  _request: NextRequest,
  { params }: { params: Promise<{ id: string }> },
) {
  return withErrorBoundary(async () => {
    const services = await createServerApplicationServices();
    const { id } = await params;
    return getRecipe({ id }, services);
  });
}
