import { describe, expect, it, vi } from "vitest";
import { GetCurrentUser } from "@/application/auth/get-current-user";
import { LoginUser } from "@/application/auth/login-user";
import { LogoutUser } from "@/application/auth/logout-user";
import { RegisterUser } from "@/application/auth/register-user";
import type {
  AuthCredentials,
  AuthPort,
  AuthResult,
  AuthUser,
} from "@/application/ports/auth";
import { authFail, authOk } from "@/application/ports/auth";

const user = { id: "user-1", email: "ana@example.com" };

function createFakeAuthPort() {
  return {
    register: vi.fn(async () => authOk({ user, sessionStarted: true })),
    login: vi.fn(async () => authOk(user)),
    logout: vi.fn(async () => authOk(undefined)),
    getCurrentUser: vi.fn(
      async (): Promise<AuthResult<AuthUser | null>> => authOk(user),
    ),
  } satisfies AuthPort;
}

const validCredentials: AuthCredentials = {
  email: "ana@example.com",
  password: "secreta123",
};

describe("RegisterUser", () => {
  it("delegates valid input to the auth port (ISSUE test case 1)", async () => {
    const port = createFakeAuthPort();
    const useCase = new RegisterUser(port);

    const result = await useCase.execute(validCredentials);

    expect(result.ok).toBe(true);
    expect(port.register).toHaveBeenCalledWith(validCredentials);
  });

  it("rejects an invalid email without touching the port", async () => {
    const port = createFakeAuthPort();
    const useCase = new RegisterUser(port);

    const result = await useCase.execute({
      email: "no-es-email",
      password: "secreta123",
    });

    expect(result).toMatchObject({ ok: false, code: "invalid_input" });
    expect(port.register).not.toHaveBeenCalled();
  });

  it("rejects passwords shorter than 6 characters without touching the port", async () => {
    const port = createFakeAuthPort();
    const useCase = new RegisterUser(port);

    const result = await useCase.execute({
      email: "ana@example.com",
      password: "12345",
    });

    expect(result).toMatchObject({ ok: false, code: "invalid_input" });
    expect(port.register).not.toHaveBeenCalled();
  });

  it("surfaces port failures as controlled errors", async () => {
    const port = createFakeAuthPort();
    port.register.mockResolvedValueOnce(
      authFail("email_already_registered", "Ya existe una cuenta con ese email."),
    );
    const useCase = new RegisterUser(port);

    const result = await useCase.execute(validCredentials);

    expect(result).toMatchObject({
      ok: false,
      code: "email_already_registered",
    });
  });
});

describe("LoginUser", () => {
  it("returns the user for correct credentials (ISSUE test case 2)", async () => {
    const port = createFakeAuthPort();
    const useCase = new LoginUser(port);

    const result = await useCase.execute(validCredentials);

    expect(result).toEqual({ ok: true, data: user });
    expect(port.login).toHaveBeenCalledWith(validCredentials);
  });

  it("returns a controlled invalid_credentials error for wrong credentials", async () => {
    const port = createFakeAuthPort();
    port.login.mockResolvedValueOnce(
      authFail("invalid_credentials", "Email o contraseña incorrectos."),
    );
    const useCase = new LoginUser(port);

    const result = await useCase.execute({
      email: "ana@example.com",
      password: "equivocada",
    });

    expect(result).toMatchObject({ ok: false, code: "invalid_credentials" });
  });

  it("rejects malformed input without touching the port", async () => {
    const port = createFakeAuthPort();
    const useCase = new LoginUser(port);

    const result = await useCase.execute({ email: "", password: "" });

    expect(result).toMatchObject({ ok: false, code: "invalid_input" });
    expect(port.login).not.toHaveBeenCalled();
  });
});

describe("LogoutUser", () => {
  it("clears the session through the port (ISSUE test case 3)", async () => {
    const port = createFakeAuthPort();
    const useCase = new LogoutUser(port);

    const result = await useCase.execute();

    expect(result.ok).toBe(true);
    expect(port.logout).toHaveBeenCalledTimes(1);
  });

  it("propagates port failures as controlled errors", async () => {
    const port = createFakeAuthPort();
    port.logout.mockResolvedValueOnce(
      authFail("unknown", "No se pudo cerrar la sesión."),
    );
    const useCase = new LogoutUser(port);

    const result = await useCase.execute();

    expect(result).toMatchObject({ ok: false, code: "unknown" });
  });
});

describe("GetCurrentUser", () => {
  it("returns the session user in a server context (ISSUE test case 5)", async () => {
    const port = createFakeAuthPort();
    const useCase = new GetCurrentUser(port);

    const result = await useCase.execute();

    expect(result).toEqual({ ok: true, data: user });
    expect(port.getCurrentUser).toHaveBeenCalledTimes(1);
  });

  it("returns null when there is no session", async () => {
    const port = createFakeAuthPort();
    port.getCurrentUser.mockResolvedValueOnce(authOk(null));
    const useCase = new GetCurrentUser(port);

    const result = await useCase.execute();

    expect(result).toEqual({ ok: true, data: null });
  });

  it("surfaces port failures as controlled errors", async () => {
    const port = createFakeAuthPort();
    port.getCurrentUser.mockResolvedValueOnce(
      authFail("unknown", "No se pudo verificar la sesión."),
    );
    const useCase = new GetCurrentUser(port);

    const result = await useCase.execute();

    expect(result).toMatchObject({ ok: false, code: "unknown" });
  });
});
