import type {
  AuthError as SupabaseAuthError,
  SupabaseClient,
} from "@supabase/supabase-js";
import { isAuthSessionMissingError } from "@supabase/supabase-js";
import type {
  AuthPort,
  AuthResult,
  AuthUser,
  ConfirmRegistrationInput,
  RegisterOutcome,
} from "@/application/ports/auth";
import { authFail, authOk } from "@/application/ports/auth";
import type { Database } from "@/types/database.types";

type AuthClient = SupabaseClient<Database>;

function toAuthUser(user: { id: string; email?: string }): AuthUser {
  return { id: user.id, email: user.email ?? "" };
}

/** Mapea errores de Supabase Auth a códigos controlados del puerto, con mensajes en español. */
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
    case "email_not_confirmed":
      // Código propio (no "unknown"): la UI necesita distinguirlo para
      // ofrecer el camino de confirmación en vez de dejar al usuario sin
      // salida en la pantalla de login. El mensaje no cambia.
      return authFail(
        "email_not_confirmed",
        "Confirma tu email antes de iniciar sesión. Revisa tu bandeja de entrada.",
      );
    case "otp_expired":
      // Supabase agrupa "token has expired or is invalid" bajo este código.
      return authFail(
        "invalid_token",
        "El código es incorrecto o expiró. Pide uno nuevo.",
      );
    case "email_address_invalid":
      return authFail("unknown", "El email no es válido.");
    case "over_email_send_rate_limit":
    case "rate_limit_exceeded":
      return authFail(
        "unknown",
        "Demasiados intentos. Inténtalo de nuevo en unos minutos.",
      );
    default:
      // Nunca se filtra el mensaje crudo de Supabase (puede venir en
      // inglés): la UI es siempre español y el fallback ya lo es.
      return authFail("unknown", fallbackMessage);
  }
}

/**
 * Adapter de Supabase para el `AuthPort` (spec 05, REQ-02/REQ-04).
 *
 * Único módulo del runtime que habla con Supabase Auth. El cliente lo
 * crean las factorías browser/server — nunca este archivo — para que el
 * mismo adapter funcione en ambos contextos y sea trivialmente mockeable
 * en tests.
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

    async confirmRegistration(
      input: ConfirmRegistrationInput,
    ): Promise<AuthResult<AuthUser>> {
      // `type: "signup"` verifica el código de 6 dígitos de la plantilla
      // "Confirm sign up". El token viaja en el cuerpo de la petición y no
      // en una URL, así que no depende del `code_verifier` PKCE del
      // navegador: funciona leyendo el email desde cualquier dispositivo.
      const { data, error } = await client.auth.verifyOtp({
        email: input.email,
        token: input.token,
        type: "signup",
      });
      if (error) {
        return mapAuthError(error, "No se pudo confirmar la cuenta.");
      }
      if (!data.user) {
        return authFail("unknown", "No se pudo confirmar la cuenta.");
      }
      return authOk(toAuthUser(data.user));
    },

    async resendConfirmation(email: string): Promise<AuthResult<void>> {
      const { error } = await client.auth.resend({ type: "signup", email });
      if (error) {
        return mapAuthError(error, "No se pudo reenviar el código.");
      }
      return authOk(undefined);
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
        // No haber sesión en esta petición es un estado normal (no autenticado).
        if (isAuthSessionMissingError(error)) return authOk(null);
        return mapAuthError(error, "No se pudo verificar la sesión.");
      }
      return data.user ? authOk(toAuthUser(data.user)) : authOk(null);
    },
  };
}
