import type { AuthPort, AuthUser } from "@/application/ports/auth";
import { UnauthorizedError } from "@/domain/errors";

/**
 * Resuelve el usuario autenticado de la sesión de servidor.
 *
 * La autorización ocurre DENTRO de cada caso de uso: el `userId` sale siempre
 * de `AuthPort.getCurrentUser()` (sesión de servidor), nunca del input del
 * cliente. Esto es defensa en profundidad junto con RLS (spec 04), no su
 * reemplazo. Sin sesión → `UnauthorizedError`.
 */
export async function requireAuthenticatedUser(
  auth: AuthPort,
): Promise<AuthUser> {
  const result = await auth.getCurrentUser();
  if (!result.ok || !result.data) {
    throw new UnauthorizedError("Se requiere una sesión autenticada.");
  }
  return result.data;
}
