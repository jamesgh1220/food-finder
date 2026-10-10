import type { NextRequest } from "next/server";
import { createServerApplicationServices } from "@/lib/composition/server-application";
import { withErrorBoundary } from "@/lib/api/http";
import { removeFavorite } from "@/lib/api/handlers/favorites";

export async function DELETE(
  request: NextRequest,
  { params }: { params: Promise<{ recipeId: string }> },
) {
  return withErrorBoundary(async () => {
    const services = await createServerApplicationServices();
    const { recipeId } = await params;
    return removeFavorite(request, services, { recipeId });
  });
}
