import type { AuthPort, AuthResult } from "@/application/ports/auth";

/**
 * LogoutUser use case (spec 05, REQ-04).
 *
 * Clears the session through the port; after success the cookies are gone
 * and protected routes redirect to /login (ISSUE test case 3).
 */
export class LogoutUser {
  constructor(private readonly auth: AuthPort) {}

  async execute(): Promise<AuthResult<void>> {
    return this.auth.logout();
  }
}
