import { isValidEmail } from "@/application/auth/email-validation";
import type { AuthPort, AuthResult } from "@/application/ports/auth";
import { authFail } from "@/application/ports/auth";

/**
 * Caso de uso ResendConfirmation.
 *
 * Pide un código de confirmación nuevo. Sin esta vía, un código perdido o
 * expirado dejaría la cuenta inaccesible para siempre.
 */
export class ResendConfirmation {
  constructor(private readonly auth: AuthPort) {}

  async execute(email: string): Promise<AuthResult<void>> {
    if (!isValidEmail(email)) {
      return authFail("invalid_input", "Introduce un email válido.");
    }
    return this.auth.resendConfirmation(email);
  }
}
