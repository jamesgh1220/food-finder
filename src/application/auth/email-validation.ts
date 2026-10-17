/**
 * Validación de email compartida por los casos de uso de auth.
 *
 * Vive aparte de `register-user.ts` para que el registro, la confirmación y
 * el reenvío de código apliquen exactamente la misma regla.
 */

export const EMAIL_PATTERN = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;

export function isValidEmail(email: string): boolean {
  return EMAIL_PATTERN.test(email);
}
