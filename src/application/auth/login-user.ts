import type {
  AuthCredentials,
  AuthPort,
  AuthResult,
  AuthUser,
} from "@/application/ports/auth";
import { validateCredentials } from "@/application/auth/register-user";

/**
 * Caso de uso LoginUser (spec 05, REQ-04).
 *
 * Credenciales incorrectas → `{ ok: false, code: "invalid_credentials" }`
 * para que la UI muestre un error controlado (caso de prueba 2 de la ISSUE).
 */
export class LoginUser {
  constructor(private readonly auth: AuthPort) {}

  async execute(credentials: AuthCredentials): Promise<AuthResult<AuthUser>> {
    const invalid = validateCredentials(credentials);
    if (invalid) return invalid as AuthResult<AuthUser>;
    return this.auth.login(credentials);
  }
}
