import type {
  AuthCredentials,
  AuthPort,
  AuthResult,
  AuthUser,
} from "@/application/ports/auth";
import { validateCredentials } from "@/application/auth/register-user";

/**
 * LoginUser use case (spec 05, REQ-04).
 *
 * Wrong credentials surface as `{ ok: false, code: "invalid_credentials" }`
 * so the UI shows a controlled error (ISSUE test case 2).
 */
export class LoginUser {
  constructor(private readonly auth: AuthPort) {}

  async execute(credentials: AuthCredentials): Promise<AuthResult<AuthUser>> {
    const invalid = validateCredentials(credentials);
    if (invalid) return invalid as AuthResult<AuthUser>;
    return this.auth.login(credentials);
  }
}
