import type { AuthPort, AuthResult, AuthUser } from "@/application/ports/auth";

/**
 * GetCurrentUser use case (spec 05, REQ-04).
 *
 * Returns the session user in server contexts, or null when there is no
 * authenticated session (ISSUE test case 5).
 */
export class GetCurrentUser {
  constructor(private readonly auth: AuthPort) {}

  async execute(): Promise<AuthResult<AuthUser | null>> {
    return this.auth.getCurrentUser();
  }
}
