import type { AuthPort, AuthResult, AuthUser } from "@/application/ports/auth";

/**
 * Caso de uso GetCurrentUser (spec 05, REQ-04).
 *
 * Devuelve el usuario de la sesión en contextos de server, o null cuando
 * no hay sesión autenticada (caso de prueba 5 de la ISSUE).
 */
export class GetCurrentUser {
  constructor(private readonly auth: AuthPort) {}

  async execute(): Promise<AuthResult<AuthUser | null>> {
    return this.auth.getCurrentUser();
  }
}
