import type { NextRequest } from "next/server";
import { createServerApplicationServices } from "@/lib/composition/server-application";
import { withErrorBoundary } from "@/lib/api/http";
import { listFavorites, addFavorite } from "@/lib/api/handlers/favorites";

export async function GET(request: NextRequest) {
  return withErrorBoundary(async () => {
    const services = await createServerApplicationServices();
    return listFavorites(request, services);
  });
}

export async function POST(request: NextRequest) {
  return withErrorBoundary(async () => {
    const services = await createServerApplicationServices();
    return addFavorite(request, services);
  });
}
