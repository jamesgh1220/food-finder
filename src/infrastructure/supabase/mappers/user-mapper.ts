import type { User } from "@/domain/ports";

/**
 * Mapeador de usuario (spec 05/06).
 *
 * Frontera de normalización: `email` anulable → cadena vacía, porque la
 * entidad de dominio `User` lo exige no nulo.
 */
export function toUser(user: {
  id: string;
  email?: string | null;
  created_at: string;
}): User {
  return {
    id: user.id,
    email: user.email ?? "",
    createdAt: new Date(user.created_at),
  };
}
