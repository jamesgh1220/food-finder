import type { PantryRepository } from "@/domain/ports";
import type { AuthPort } from "@/application/ports/auth";
import { requireAuthenticatedUser } from "@/application/shared/require-authenticated-user";

/**
 * Caso de uso ClearUserPantry (spec 07).
 *
 * Vacía únicamente la despensa del usuario de la sesión; nunca la de otro
 * usuario.
 */
export class ClearUserPantry {
  constructor(
    private readonly pantry: PantryRepository,
    private readonly auth: AuthPort,
  ) {}

  async execute(): Promise<void> {
    const user = await requireAuthenticatedUser(this.auth);
    await this.pantry.clearByUser(user.id);
  }
}
