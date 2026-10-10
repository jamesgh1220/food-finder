import type { NextRequest } from "next/server";
import { createServerApplicationServices } from "@/lib/composition/server-application";
import { withErrorBoundary } from "@/lib/api/http";
import { updatePantryItem, removePantryItem } from "@/lib/api/handlers/pantry";

export async function PATCH(
  request: NextRequest,
  { params }: { params: Promise<{ id: string }> },
) {
  return withErrorBoundary(async () => {
    const services = await createServerApplicationServices();
    const { id } = await params;
    return updatePantryItem(request, services, { id });
  });
}

export async function DELETE(
  request: NextRequest,
  { params }: { params: Promise<{ id: string }> },
) {
  return withErrorBoundary(async () => {
    const services = await createServerApplicationServices();
    const { id } = await params;
    return removePantryItem(request, services, { id });
  });
}
