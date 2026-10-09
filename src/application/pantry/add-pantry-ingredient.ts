import type { PantryItem } from "@/domain/entities";
import type { PantryRepository } from "@/domain/ports";
import { Quantity, Unit } from "@/domain/value-objects";
import type { AuthPort } from "@/application/ports/auth";
import { requireAuthenticatedUser } from "@/application/shared/require-authenticated-user";

export interface AddPantryIngredientInput {
  ingredientId: string;
  quantity: number;
  unit: string;
}

/**
 * Caso de uso AddPantryIngredient (spec 07).
 *
 * Exige sesión y asocia la fila SIEMPRE al `userId` de la sesión de servidor:
 * el cliente nunca aporta el propietario. `upsert` mantiene la semántica de
 * insertar-o-actualizar por (userId, ingredientId).
 */
export class AddPantryIngredient {
  constructor(
    private readonly pantry: PantryRepository,
    private readonly auth: AuthPort,
  ) {}

  async execute(input: AddPantryIngredientInput): Promise<PantryItem> {
    const user = await requireAuthenticatedUser(this.auth);

    const now = new Date();
    const item: PantryItem = {
      id: globalThis.crypto.randomUUID(),
      userId: user.id,
      ingredientId: input.ingredientId,
      quantity: Quantity.create(input.quantity),
      unit: Unit.create(input.unit),
      createdAt: now,
      updatedAt: now,
    };

    return this.pantry.upsert(item);
  }
}
