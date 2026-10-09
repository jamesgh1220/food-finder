import type { SupabaseClient } from "@supabase/supabase-js";
import type { Database } from "@/types/database.types";
import type { PostgrestError } from "@supabase/supabase-js";
import { vi } from "vitest";

/**
 * Estado del último llamado de consulta (para inspecciones en tests).
 */
export interface FakeQueryCall {
  table: string;
  method: string;
  args: unknown[];
}

/**
 * Respuesta que puede devolver la cadena de consulta.
 */
export interface FakeResponse {
  data?: unknown;
  error?: PostgrestError | unknown;
}

/**
 * Builder encadenable que permite registrar cada llamada y devolver una
 * respuesta configurable. También implementa `then` para permitir usarlo como
 * promesa (p. ej. `await query` o `await query.order(...)`).
 */
export interface FakeQueryBuilder {
  [key: string]: unknown;
  calls: FakeQueryCall[];
  single(): Promise<unknown>;
  maybeSingle(): Promise<unknown>;
  then(
    onFulfilled?: ((value: unknown) => unknown) | null,
    onRejected?: ((reason: unknown) => unknown) | null,
  ): Promise<unknown>;
}

/**
 * Opciones para crear el cliente fake reutilizable.
 */
export interface CreateFakeSupabaseClientOptions {
  response?:
    | FakeResponse
    | ((lastCall: FakeQueryCall) => FakeResponse);
  authAdmin?: {
    getUserById?: () => Promise<unknown>;
    listUsers?: (params?: {
      page?: number;
      perPage?: number;
    }) => Promise<unknown>;
  };
}

/**
 * Crea un cliente Supabase fake para las pruebas unitarias.
 *
 * - `client.from(table)` devuelve un builder encadenable que registra todas las
 *   llamadas (`eq`, `in`, `ilike`, `order`, `upsert`, `select`, `delete`, etc.).
 * - `single()` y `maybeSingle()` resuelven a la respuesta configurada.
 * - `then` hace que `await query`/`await query.order(...)` resuelva también.
 * - `client.auth.admin` expone mocks configurables.
 */
export function createFakeSupabaseClient(
  options: CreateFakeSupabaseClientOptions = {},
) {
  const calls: FakeQueryCall[] = [];

  const defaultAuthAdmin = {
    getUserById: vi.fn(async () => ({
      data: { user: null },
      error: null,
    })),
    listUsers: vi.fn(async () => ({
      data: { users: [], aud: "test", page: 1, perPage: 1000, total: 0 },
      error: null,
    })),
  };

  const authAdmin: {
    getUserById: () => Promise<unknown>;
    listUsers: (params?: { page?: number; perPage?: number }) => Promise<unknown>;
  } = {
    getUserById: options.authAdmin?.getUserById ?? defaultAuthAdmin.getUserById,
    listUsers: options.authAdmin?.listUsers ?? defaultAuthAdmin.listUsers,
  };

  const resolveResponse = (): FakeResponse => {
    const lastCall = calls[calls.length - 1];
    if (lastCall === undefined) {
      return { data: null, error: null };
    }
    const resp = options.response;
    if (typeof resp === "function") {
      return resp(lastCall);
    }
    return resp ?? { data: null, error: null };
  };

  const createBuilder = (table: string): FakeQueryBuilder => {
    const builder: Record<string, unknown> & {
      calls: FakeQueryCall[];
      single: () => Promise<unknown>;
      maybeSingle: () => Promise<unknown>;
      then: (onFulfilled?: ((value: unknown) => unknown) | null, onRejected?: ((reason: unknown) => unknown) | null) => Promise<unknown>;
    } = {
      calls,
      single: async () => {
        return resolveResponse();
      },
      maybeSingle: async () => {
        return resolveResponse();
      },
      then: (onFulfilled, onRejected) => {
        return Promise.resolve(resolveResponse()).then(onFulfilled as (value: unknown) => unknown, onRejected as (reason: unknown) => unknown);
      },
    };

    const handler: ProxyHandler<Record<string, unknown>> = {
      get(target, prop, receiver) {
        if (prop in target) {
          return (target as Record<string, unknown>)[prop as string];
        }
        if (typeof prop === "symbol") {
          return Reflect.get(target, prop, receiver);
        }
        return (...args: unknown[]) => {
          calls.push({ table, method: String(prop), args });
          return new Proxy(builder, handler);
        };
      },
    };

    return new Proxy(builder, handler) as unknown as FakeQueryBuilder;
  };

  const client = {
    from: (table: string) => createBuilder(table),
    auth: {
      admin: authAdmin,
    },
  };

  return {
    calls,
    client: client as unknown as SupabaseClient<Database>,
    authAdmin,
  };
}
