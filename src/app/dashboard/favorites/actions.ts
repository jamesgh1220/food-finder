"use server";

import { refresh } from "next/cache";
import { z } from "zod";
import { ConflictError, NotFoundError, UnauthorizedError } from "@/domain/errors";
import { createServerApplicationServices } from "@/lib/composition/server-application";

/**
 * Favorites Server Actions (spec 14, REQ-08; PROMTP #44; Caso 6).
 *
 * Igual que las Server Actions de pantry (spec 13): cada acción es un punto de
 * entrada no confiable — valida su forma con zod, deriva la identidad de la
 * sesión dentro del caso de uso (que lanza `UnauthorizedError` sin sesión),
 * devuelve un resultado serializable discriminado (nunca filas crudas) y llama
 * `refresh()` tras mutar para que la ruta actual re-renderice con datos frescos.
 */

/** Resultado serializable compartido por las mutaciones de favoritos. */
export type FavoriteActionResult = { ok: true } | { ok: false; message: string };

/** Fallbacks para fallos sin clave i18n dedicada. */
const GENERIC_ERROR = "No pudimos completar la acción. Inténtalo de nuevo.";
const UNAUTHORIZED_ERROR = "Tu sesión expiró. Vuelve a iniciar sesión.";
const NOT_FOUND_ERROR = "Esa receta ya no está disponible.";

const favoriteInputSchema = z.object({
  recipeId: z.string().min(1),
});

/** Traduce un error de dominio a un resultado serializable (sin filtrar detalles). */
function toActionResult(error: unknown): FavoriteActionResult {
  if (error instanceof UnauthorizedError) {
    return { ok: false, message: UNAUTHORIZED_ERROR };
  }
  if (error instanceof NotFoundError) {
    return { ok: false, message: NOT_FOUND_ERROR };
  }
  if (error instanceof ConflictError) {
    // El estado deseado ya se alcanzó: la operación es idempotente.
    return { ok: true };
  }
  return { ok: false, message: GENERIC_ERROR };
}

export async function addFavoriteAction(input: {
  recipeId: string;
}): Promise<FavoriteActionResult> {
  const parsed = favoriteInputSchema.safeParse(input);
  if (!parsed.success) {
    return { ok: false, message: GENERIC_ERROR };
  }

  const services = await createServerApplicationServices();
  try {
    await services.addFavoriteRecipe.execute({
      recipeId: parsed.data.recipeId,
    });
  } catch (error) {
    return toActionResult(error);
  }

  refresh();
  return { ok: true };
}

export async function removeFavoriteAction(input: {
  recipeId: string;
}): Promise<FavoriteActionResult> {
  const parsed = favoriteInputSchema.safeParse(input);
  if (!parsed.success) {
    return { ok: false, message: GENERIC_ERROR };
  }

  const services = await createServerApplicationServices();
  try {
    await services.removeFavoriteRecipe.execute({
      recipeId: parsed.data.recipeId,
    });
  } catch (error) {
    return toActionResult(error);
  }

  refresh();
  return { ok: true };
}
