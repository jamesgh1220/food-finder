import type { PantryRepository } from "@/domain/ports";
import type { AuthPort } from "@/application/ports/auth";
import { requireAuthenticatedUser } from "@/application/shared/require-authenticated-user";

export interface RemovePantryIngredientInput {
  ingredientId: string;
}

/**
 * Caso de uso RemovePantryIngredient (spec 07).
 *
 * Exige sesión y elimina la fila del usuario de la sesión. Idempotente: si el
 * ingrediente no estaba, el repositorio no falla.
 */
export class RemovePantryIngredient {
  constructor(
    private readonly pantry: PantryRepository,
    private readonly auth: AuthPort,
  ) {}

  async execute(input: RemovePantryIngredientInput): Promise<void> {
    const user = await requireAuthenticatedUser(this.auth);
    await this.pantry.remove(user.id, input.ingredientId);
  }
}
