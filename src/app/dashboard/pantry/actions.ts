"use server";

import { refresh } from "next/cache";
import { z } from "zod";
import type { Ingredient } from "@/domain/entities";
import {
  NotFoundError,
  UnauthorizedError,
  ValidationError,
} from "@/domain/errors";
import { createServerApplicationServices } from "@/lib/composition/server-application";
import { messages } from "@/lib/i18n/messages";

/**
 * Pantry Server Actions (spec 13, T4; PROMTP #41).
 *
 * Every action is an untrusted entry point: it validates its input shape with
 * zod, derives identity from the server session inside the use case (which
 * throws `UnauthorizedError` when there is no session), returns a serializable
 * discriminated result — never raw rows or value-object instances — and calls
 * `refresh()` after a successful mutation so the current `/dashboard/pantry`
 * route re-renders with fresh server data (read-your-own-writes).
 */

/** Serializable outcome shared by the pantry mutations. */
export type PantryActionResult = { ok: true } | { ok: false; message: string };

/** Fallbacks for failures that have no dedicated i18n key. */
const GENERIC_ERROR = "No pudimos completar la acción. Inténtalo de nuevo.";
const UNAUTHORIZED_ERROR = "Tu sesión expiró. Vuelve a iniciar sesión.";
const NOT_FOUND_ERROR = "Ese ingrediente ya no está en tu despensa.";

const searchQuerySchema = z.string().trim().min(1);

const addInputSchema = z.object({
  ingredientId: z.string().min(1),
  quantity: z.number().finite().min(0),
  unit: z.string().trim().min(1),
});

const updateInputSchema = addInputSchema;

const removeInputSchema = z.object({
  ingredientId: z.string().min(1),
});

/** Maps a zod failure to the field-level Spanish copy from the i18n module. */
function validationMessage(error: z.ZodError): string {
  const fields = new Set(error.issues.map((issue) => issue.path[0]));
  if (fields.has("quantity")) return messages.pantry.validation.quantity;
  if (fields.has("unit")) return messages.pantry.validation.unit;
  return GENERIC_ERROR;
}

/** Maps a thrown domain error to a serializable result (never leaks details). */
function toActionResult(error: unknown): PantryActionResult {
  if (error instanceof UnauthorizedError) {
    return { ok: false, message: UNAUTHORIZED_ERROR };
  }
  if (error instanceof NotFoundError) {
    // The use case already composes a user-facing Spanish message.
    return { ok: false, message: NOT_FOUND_ERROR };
  }
  if (error instanceof ValidationError) {
    return { ok: false, message: GENERIC_ERROR };
  }
  return { ok: false, message: GENERIC_ERROR };
}

/**
 * Case-insensitive ingredient lookup for the pantry combobox. The domain
 * `Ingredient` is a plain data interface (no class instances), so returning it
 * directly satisfies `IngredientSearch.onSearch` and stays serializable.
 */
export async function searchIngredientsAction(
  query: string,
): Promise<Ingredient[]> {
  const parsed = searchQuerySchema.safeParse(query);
  if (!parsed.success) return [];

  const services = await createServerApplicationServices();
  return services.searchIngredients.execute({ query: parsed.data });
}

export async function addPantryIngredientAction(input: {
  ingredientId: string;
  quantity: number;
  unit: string;
}): Promise<PantryActionResult> {
  const parsed = addInputSchema.safeParse(input);
  if (!parsed.success) {
    return { ok: false, message: validationMessage(parsed.error) };
  }

  const services = await createServerApplicationServices();
  try {
    await services.addPantryIngredient.execute(parsed.data);
  } catch (error) {
    return toActionResult(error);
  }

  refresh();
  return { ok: true };
}

export async function updatePantryIngredientAction(input: {
  ingredientId: string;
  quantity: number;
  unit: string;
}): Promise<PantryActionResult> {
  const parsed = updateInputSchema.safeParse(input);
  if (!parsed.success) {
    return { ok: false, message: validationMessage(parsed.error) };
  }

  const services = await createServerApplicationServices();
  try {
    await services.updatePantryIngredient.execute(parsed.data);
  } catch (error) {
    return toActionResult(error);
  }

  refresh();
  return { ok: true };
}

export async function removePantryIngredientAction(input: {
  ingredientId: string;
}): Promise<PantryActionResult> {
  const parsed = removeInputSchema.safeParse(input);
  if (!parsed.success) {
    return { ok: false, message: GENERIC_ERROR };
  }

  const services = await createServerApplicationServices();
  try {
    await services.removePantryIngredient.execute({
      ingredientId: parsed.data.ingredientId,
    });
  } catch (error) {
    return toActionResult(error);
  }

  refresh();
  return { ok: true };
}

export async function clearUserPantryAction(): Promise<PantryActionResult> {
  const services = await createServerApplicationServices();
  try {
    await services.clearUserPantry.execute();
  } catch (error) {
    return toActionResult(error);
  }

  refresh();
  return { ok: true };
}
