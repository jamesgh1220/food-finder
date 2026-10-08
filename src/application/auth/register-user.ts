import type {
  AuthCredentials,
  AuthPort,
  AuthResult,
  RegisterOutcome,
} from "@/application/ports/auth";
import { authFail } from "@/application/ports/auth";

const EMAIL_PATTERN = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;
const MIN_PASSWORD_LENGTH = 6;

/** Validación compartida de entrada: todos los casos de uso fallan antes de tocar el puerto. */
export function validateCredentials(
  credentials: AuthCredentials,
): AuthResult<never> | null {
  if (!EMAIL_PATTERN.test(credentials.email)) {
    return authFail("invalid_input", "Introduce un email válido.");
  }
  if (credentials.password.length < MIN_PASSWORD_LENGTH) {
    return authFail(
      "invalid_input",
      `La contraseña debe tener al menos ${MIN_PASSWORD_LENGTH} caracteres.`,
    );
  }
  return null;
}

/**
 * Caso de uso RegisterUser (spec 05, REQ-04).
 *
 * Valida la entrada y delega en el puerto de auth. Los fallos esperados
 * vuelven como errores controlados (`AuthResult`), nunca como excepciones.
 */
export class RegisterUser {
  constructor(private readonly auth: AuthPort) {}

  async execute(
    credentials: AuthCredentials,
  ): Promise<AuthResult<RegisterOutcome>> {
    const invalid = validateCredentials(credentials);
    if (invalid) return invalid as AuthResult<RegisterOutcome>;
    return this.auth.register(credentials);
  }
}
