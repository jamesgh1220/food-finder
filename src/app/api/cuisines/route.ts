import type { NextRequest } from "next/server";
import { createServerApplicationServices } from "@/lib/composition/server-application";
import { withErrorBoundary } from "@/lib/api/http";
import { listCuisines } from "@/lib/api/handlers/cuisines";

export async function GET(request: NextRequest) {
  return withErrorBoundary(async () => {
    const services = await createServerApplicationServices();
    return listCuisines(request, services);
  });
}
