import type { SupabaseClient } from "@supabase/supabase-js";
import type { UserRepository } from "@/domain/ports";
import type { Database } from "@/types/database.types";
import { toUser } from "../mappers";
import { toRepositoryError } from "./repository-error";

/**
 * Límite de páginas para `listUsers` al paginar por email.
 *
 * La API Admin de Auth no expone una búsqueda por email indexada: es necesario
 * paginar hasta encontrarlo o agotar el lote. El cap evita un bucle infinito.
 */
const MAX_PAGES = 50;

/**
 * Repositorio Supabase de usuarios (spec 06, REQ-08).
 *
 * `findById` y `findByEmail` usan `auth.admin.*` (cliente admin). El email
 * pertenece a `auth.users`, nunca a `profiles`: `profiles` solo guarda
 * metadatos de la app (p. ej. display name, avatar). `save` persiste/garantiza
 * la existencia de la fila en `profiles` por id.
 */
export function createSupabaseUserRepository(
  client: SupabaseClient<Database>,
): UserRepository {
  return {
    async findById(id) {
      const { data, error } = await client.auth.admin.getUserById(id);

      // Tratamiento de "no encontrado": devuelve null (no es un error de repo).
      if (error) {
        const isNotFound =
          (error as { status?: number; message?: string }).status === 404 ||
          (error.message?.toLowerCase().includes("not found") ?? false);
        if (isNotFound) {
          return null;
        }
        throw toRepositoryError("No se pudo obtener el usuario.", error);
      }

      if (!data?.user) {
        return null;
      }
      return toUser(data.user);
    },

    async findByEmail(email) {
      const target = email.trim().toLowerCase();
      let page = 1;
      const perPage = 1000;

      // La API Admin no tiene lookup por email directo: se recorre con paginación.
      for (let current = 1; current <= MAX_PAGES; current += 1) {
        const result = await client.auth.admin.listUsers({ page, perPage });
        if (result.error) {
          throw toRepositoryError("No se pudo obtener el usuario.", result.error);
        }

        const users = result.data.users ?? [];
        for (const user of users) {
          if ((user.email?.toLowerCase() ?? "") === target) {
            return toUser(user);
          }
        }

        // No hay más páginas si el número de resultados es menor a perPage.
        if (users.length < perPage) {
          break;
        }
        page += 1;
      }
      return null;
    },

    async save(user) {
      // `profiles` almacena solo metadatos de aplicación; el email es propiedad
      // de `auth.users`. El upsert garantiza la fila de perfil.
      const { error } = await client
        .from("profiles")
        .upsert({ id: user.id }, { onConflict: "id" });

      if (error) {
        throw toRepositoryError("No se pudo guardar el usuario.", error);
      }
      return user;
    },
  };
}
