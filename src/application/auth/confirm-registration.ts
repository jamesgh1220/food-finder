import { isValidEmail } from "@/application/auth/email-validation";
import type {
  AuthPort,
  AuthResult,
  AuthUser,
  ConfirmRegistrationInput,
} from "@/application/ports/auth";
import { authFail } from "@/application/ports/auth";

/** El código que envía Supabase es siempre de 6 dígitos (`{{ .Token }}`). */
const TOKEN_PATTERN = /^\d{6}$/;

/**
 * Caso de uso ConfirmRegistration.
 *
 * Confirma la cuenta con el código de 6 dígitos enviado por email. Es la vía
 * que funciona desde cualquier dispositivo: el link del email depende del
 * `code_verifier` PKCE, que vive solo en el navegador donde se registró.
 */
export class ConfirmRegistration {
  constructor(private readonly auth: AuthPort) {}

  async execute(input: ConfirmRegistrationInput): Promise<AuthResult<AuthUser>> {
    if (!isValidEmail(input.email)) {
      return authFail("invalid_input", "Introduce un email válido.");
    }
    if (!TOKEN_PATTERN.test(input.token)) {
      return authFail("invalid_input", "El código debe tener 6 dígitos.");
    }
    return this.auth.confirmRegistration(input);
  }
}
