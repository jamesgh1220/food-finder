/**
 * Auth port (spec 05, REQ-02/REQ-04).
 *
 * The application layer defines the abstraction; Supabase is only an
 * adapter in `src/infrastructure/auth/`. Nothing in this file may import
 * `@supabase/*`, Next.js or React.
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
 * Controlled result — use cases never throw for expected failures so the UI
 * can render a specific Spanish message per code (ISSUE test case 2).
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
   * False when the project requires email confirmation: the account was
   * created but no session exists yet, so the UI must not redirect to
   * /dashboard (ISSUE test case 1 assumes confirmation is disabled).
   */
  sessionStarted: boolean;
}

export interface AuthPort {
  /** Signs up with email/password and starts a session when confirmation is not required. */
  register(credentials: AuthCredentials): Promise<AuthResult<RegisterOutcome>>;
  /** Signs in with email/password. */
  login(credentials: AuthCredentials): Promise<AuthResult<AuthUser>>;
  /** Clears the session and its cookies. */
  logout(): Promise<AuthResult<void>>;
  /** Current session user on a server context, or null when unauthenticated. */
  getCurrentUser(): Promise<AuthResult<AuthUser | null>>;
}
