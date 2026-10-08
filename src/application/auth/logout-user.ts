import type { AuthPort, AuthResult } from "@/application/ports/auth";

/**
 * Caso de uso LogoutUser (spec 05, REQ-04).
 *
 * Limpia la sesión a través del puerto; tras el éxito las cookies quedan
 * eliminadas y las rutas protegidas redirigen a /login (caso de prueba 3
 * de la ISSUE).
 */
export class LogoutUser {
  constructor(private readonly auth: AuthPort) {}

  async execute(): Promise<AuthResult<void>> {
    return this.auth.logout();
  }
}
