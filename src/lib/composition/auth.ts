import { ConfirmRegistration } from "@/application/auth/confirm-registration";
import { GetCurrentUser } from "@/application/auth/get-current-user";
import { LoginUser } from "@/application/auth/login-user";
import { LogoutUser } from "@/application/auth/logout-user";
import { RegisterUser } from "@/application/auth/register-user";
import { ResendConfirmation } from "@/application/auth/resend-confirmation";
import type { AuthPort } from "@/application/ports/auth";

/**
 * Wiring de auth (spec 05): el ÚNICO lugar donde los casos de uso se
 * atan a un `AuthPort`. `browser-auth.ts` y `server-auth.ts` eligen el
 * adapter concreto según el contexto; los tests inyectan aquí un puerto
 * falso en su lugar.
 */
export interface AuthServices {
  registerUser: RegisterUser;
  confirmRegistration: ConfirmRegistration;
  resendConfirmation: ResendConfirmation;
  loginUser: LoginUser;
  logoutUser: LogoutUser;
  getCurrentUser: GetCurrentUser;
}

export function createAuthServices(port: AuthPort): AuthServices {
  return {
    registerUser: new RegisterUser(port),
    confirmRegistration: new ConfirmRegistration(port),
    resendConfirmation: new ResendConfirmation(port),
    loginUser: new LoginUser(port),
    logoutUser: new LogoutUser(port),
    getCurrentUser: new GetCurrentUser(port),
  };
}
