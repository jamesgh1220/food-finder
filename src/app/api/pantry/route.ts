import type { NextRequest } from "next/server";
import { createServerApplicationServices } from "@/lib/composition/server-application";
import { withErrorBoundary } from "@/lib/api/http";
import { listPantry, addPantryItem } from "@/lib/api/handlers/pantry";

export async function GET(request: NextRequest) {
  return withErrorBoundary(async () => {
    const services = await createServerApplicationServices();
    return listPantry(request, services);
  });
}

export async function POST(request: NextRequest) {
  return withErrorBoundary(async () => {
    const services = await createServerApplicationServices();
    return addPantryItem(request, services);
  });
}
