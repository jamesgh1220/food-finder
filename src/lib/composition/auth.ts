import { GetCurrentUser } from "@/application/auth/get-current-user";
import { LoginUser } from "@/application/auth/login-user";
import { LogoutUser } from "@/application/auth/logout-user";
import { RegisterUser } from "@/application/auth/register-user";
import type { AuthPort } from "@/application/ports/auth";

/**
 * Auth wiring (spec 05): the ONLY place use cases are bound to an `AuthPort`.
 * `browser-auth.ts` and `server-auth.ts` choose the concrete Supabase
 * adapter per context; tests inject a fake port here instead.
 */
export interface AuthServices {
  registerUser: RegisterUser;
  loginUser: LoginUser;
  logoutUser: LogoutUser;
  getCurrentUser: GetCurrentUser;
}

export function createAuthServices(port: AuthPort): AuthServices {
  return {
    registerUser: new RegisterUser(port),
    loginUser: new LoginUser(port),
    logoutUser: new LogoutUser(port),
    getCurrentUser: new GetCurrentUser(port),
  };
}
