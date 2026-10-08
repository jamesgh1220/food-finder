import type {
  AuthCredentials,
  AuthPort,
  AuthResult,
  RegisterOutcome,
} from "@/application/ports/auth";
import { authFail } from "@/application/ports/auth";

const EMAIL_PATTERN = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;
const MIN_PASSWORD_LENGTH = 6;

/** Shared input validation so every use case fails before hitting the port. */
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
 * RegisterUser use case (spec 05, REQ-04).
 *
 * Validates input, then delegates to the auth port. Expected failures come
 * back as controlled `AuthResult` errors, never as exceptions.
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
