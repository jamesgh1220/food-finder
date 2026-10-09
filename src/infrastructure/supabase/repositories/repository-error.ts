import { RepositoryError } from "@/domain/errors";

/**
 * Frontera que normaliza cualquier fallo de persistencia (REQ-07).
 *
 * Convierte un error crudo de Supabase/Postgres en un `RepositoryError` con un
 * mensaje seguro para el dominio: NUNCA propaga el mensaje original, porque
 * podría filtrar detalles internos del motor de base de datos. Solo conserva el
 * `code` técnico dentro de `details` para diagnóstico.
 */
export function toRepositoryError(
  message: string,
  error: unknown,
): RepositoryError {
  const code =
    typeof error === "object" && error !== null
      ? (error as { code?: string }).code
      : undefined;
  return new RepositoryError(message, code ? { code } : undefined);
}
