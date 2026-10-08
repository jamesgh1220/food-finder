import type {
  AuthError as SupabaseAuthError,
  SupabaseClient,
} from "@supabase/supabase-js";
import { isAuthSessionMissingError } from "@supabase/supabase-js";
import type {
  AuthPort,
  AuthResult,
  AuthUser,
  RegisterOutcome,
} from "@/application/ports/auth";
import { authFail, authOk } from "@/application/ports/auth";
import type { Database } from "@/types/database.types";

type AuthClient = SupabaseClient<Database>;

function toAuthUser(user: { id: string; email?: string }): AuthUser {
  return { id: user.id, email: user.email ?? "" };
}

/** Maps Supabase Auth errors to controlled port codes with Spanish messages. */
function mapAuthError(
  error: SupabaseAuthError,
  fallbackMessage: string,
): AuthResult<never> {
  switch (error.code) {
    case "invalid_credentials":
      return authFail("invalid_credentials", "Email o contraseña incorrectos.");
    case "user_already_exists":
      return authFail(
        "email_already_registered",
        "Ya existe una cuenta con ese email.",
      );
    case "weak_password":
      return authFail(
        "weak_password",
        "La contraseña es demasiado débil. Usa al menos 6 caracteres.",
      );
    default:
      return authFail("unknown", error.message || fallbackMessage);
  }
}

/**
 * Supabase adapter for the `AuthPort` (spec 05, REQ-02/REQ-04).
 *
 * This is the only module in the application runtime that talks to
 * Supabase Auth. The client it receives is created by the browser/server
 * factories — never by this file — so the same adapter works in both
 * contexts and stays trivially mockable in tests.
 */
export function createSupabaseAuthPort(client: AuthClient): AuthPort {
  return {
    async register(credentials): Promise<AuthResult<RegisterOutcome>> {
      const { data, error } = await client.auth.signUp(credentials);
      if (error) return mapAuthError(error, "No se pudo crear la cuenta.");
      if (!data.user) {
        return authFail("unknown", "No se pudo crear la cuenta.");
      }
      return authOk({
        user: toAuthUser(data.user),
        sessionStarted: data.session !== null,
      });
    },

    async login(credentials): Promise<AuthResult<AuthUser>> {
      const { data, error } = await client.auth.signInWithPassword(
        credentials,
      );
      if (error) return mapAuthError(error, "No se pudo iniciar sesión.");
      return authOk(toAuthUser(data.user));
    },

    async logout(): Promise<AuthResult<void>> {
      const { error } = await client.auth.signOut();
      if (error) return mapAuthError(error, "No se pudo cerrar la sesión.");
      return authOk(undefined);
    },

    async getCurrentUser(): Promise<AuthResult<AuthUser | null>> {
      const { data, error } = await client.auth.getUser();
      if (error) {
        // No session on this request is a normal, unauthenticated state.
        if (isAuthSessionMissingError(error)) return authOk(null);
        return mapAuthError(error, "No se pudo verificar la sesión.");
      }
      return data.user ? authOk(toAuthUser(data.user)) : authOk(null);
    },
  };
}
