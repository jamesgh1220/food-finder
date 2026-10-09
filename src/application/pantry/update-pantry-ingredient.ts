import type { PantryItem } from "@/domain/entities";
import type { PantryRepository } from "@/domain/ports";
import { Quantity, Unit } from "@/domain/value-objects";
import { NotFoundError } from "@/domain/errors";
import type { AuthPort } from "@/application/ports/auth";
import { requireAuthenticatedUser } from "@/application/shared/require-authenticated-user";

export interface UpdatePantryIngredientInput {
  ingredientId: string;
  quantity: number;
  unit: string;
}

/**
 * Caso de uso UpdatePantryIngredient (spec 07).
 *
 * Localiza la fila por (usuario de sesión, ingrediente); si no existe lanza
 * `NotFoundError`. Solo actualiza cantidad/unidad y la marca de tiempo.
 */
export class UpdatePantryIngredient {
  constructor(
    private readonly pantry: PantryRepository,
    private readonly auth: AuthPort,
  ) {}

  async execute(input: UpdatePantryIngredientInput): Promise<PantryItem> {
    const user = await requireAuthenticatedUser(this.auth);

    const existing = await this.pantry.findByUserAndIngredient(
      user.id,
      input.ingredientId,
    );
    if (!existing) {
      throw new NotFoundError("El ingrediente no está en tu despensa.");
    }

    return this.pantry.upsert({
      ...existing,
      quantity: Quantity.create(input.quantity),
      unit: Unit.create(input.unit),
      updatedAt: new Date(),
    });
  }
}
