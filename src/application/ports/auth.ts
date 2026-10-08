/**
 * Puerto de autenticación (spec 05, REQ-02/REQ-04).
 *
 * La capa application define la abstracción; Supabase es solo un adapter
 * en `src/infrastructure/auth/`. Nada de este archivo puede importar
 * `@supabase/*`, Next.js ni React.
 */

export interface AuthUser {
  id: string;
  email: string;
}

export interface AuthCredentials {
  email: string;
  password: string;
}

export type AuthErrorCode =
  | "invalid_credentials"
  | "email_already_registered"
  | "weak_password"
  | "invalid_input"
  | "unknown";

/**
 * Resultado controlado — los casos de uso nunca lanzan excepciones para
 * fallos esperados, para que la UI pueda mostrar un mensaje específico en
 * español por código (caso de prueba 2 de la ISSUE).
 */
export type AuthResult<T> =
  | { ok: true; data: T }
  | { ok: false; code: AuthErrorCode; message: string };

export function authOk<T>(data: T): AuthResult<T> {
  return { ok: true, data };
}

export function authFail<T>(
  code: AuthErrorCode,
  message: string,
): AuthResult<T> {
  return { ok: false, code, message };
}

export interface RegisterOutcome {
  user: AuthUser;
  /**
   * Falso cuando el proyecto exige confirmación de email: la cuenta se
   * creó pero aún no existe sesión, así que la UI no debe redirigir a
   * /dashboard (el caso de prueba 1 de la ISSUE asume confirmación
   * desactivada).
   */
  sessionStarted: boolean;
}

export interface AuthPort {
  /** Registro con email/password; inicia sesión si no se requiere confirmación. */
  register(credentials: AuthCredentials): Promise<AuthResult<RegisterOutcome>>;
  /** Inicio de sesión con email/password. */
  login(credentials: AuthCredentials): Promise<AuthResult<AuthUser>>;
  /** Cierra la sesión y elimina sus cookies. */
  logout(): Promise<AuthResult<void>>;
  /** Usuario de la sesión en contexto server, o null si no hay sesión. */
  getCurrentUser(): Promise<AuthResult<AuthUser | null>>;
}
