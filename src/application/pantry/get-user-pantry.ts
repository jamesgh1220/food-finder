import type { PantryItem } from "@/domain/entities";
import type { PantryRepository } from "@/domain/ports";
import type { AuthPort } from "@/application/ports/auth";
import { requireAuthenticatedUser } from "@/application/shared/require-authenticated-user";

/**
 * Caso de uso GetUserPantry (spec 07).
 *
 * Devuelve SOLO las filas del usuario de la sesión; el repositorio filtra por
 * el `userId` resuelto en servidor.
 */
export class GetUserPantry {
  constructor(
    private readonly pantry: PantryRepository,
    private readonly auth: AuthPort,
  ) {}

  async execute(): Promise<PantryItem[]> {
    const user = await requireAuthenticatedUser(this.auth);
    return this.pantry.listByUser(user.id);
  }
}
