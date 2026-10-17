import { describe, expect, it, vi } from "vitest";
import type { SupabaseClient } from "@supabase/supabase-js";
import { createSupabaseAuthPort } from "@/infrastructure/auth/supabase-auth-port";

type AuthErrorLike = { message: string; status: number; code?: string };

function fakeClient(overrides: {
  signUp?: () => Promise<{ data: unknown; error: AuthErrorLike | null }>;
  signInWithPassword?: () => Promise<{ data: unknown; error: AuthErrorLike | null }>;
  verifyOtp?: () => Promise<{ data: unknown; error: AuthErrorLike | null }>;
  resend?: () => Promise<{ data?: unknown; error: AuthErrorLike | null }>;
}) {
  return {
    auth: {
      signUp: overrides.signUp ?? vi.fn(),
      signInWithPassword: overrides.signInWithPassword ?? vi.fn(),
      verifyOtp: vi.fn(overrides.verifyOtp),
      resend: vi.fn(overrides.resend),
      signOut: vi.fn(),
      getUser: vi.fn(),
    },
  } as unknown as SupabaseClient;
}

const creds = { email: "user@test.dev", password: "secret123" };
const confirmation = { email: "user@test.dev", token: "123456" };

describe("createSupabaseAuthPort — mapeo de errores a mensajes en español", () => {
  it("email_address_invalid → mensaje español", async () => {
    const port = createSupabaseAuthPort(
      fakeClient({
        signUp: async () => ({
          data: { user: null, session: null },
          error: {
            code: "email_address_invalid",
            message: 'Email address "x@example.com" is invalid',
            status: 400,
          },
        }),
      }),
    );
    const result = await port.register(creds);
    expect(result).toEqual({
      ok: false,
      code: "unknown",
      message: "El email no es válido.",
    });
  });

  it("over_email_send_rate_limit → mensaje español", async () => {
    const port = createSupabaseAuthPort(
      fakeClient({
        signUp: async () => ({
          data: { user: null, session: null },
          error: {
            code: "over_email_send_rate_limit",
            message: "email rate limit exceeded",
            status: 429,
          },
        }),
      }),
    );
    const result = await port.register(creds);
    expect(result.ok).toBe(false);
    if (!result.ok) {
      expect(result.message).toBe(
        "Demasiados intentos. Inténtalo de nuevo en unos minutos.",
      );
    }
  });

  it("email_not_confirmed → mensaje español (S6)", async () => {
    const port = createSupabaseAuthPort(
      fakeClient({
        signInWithPassword: async () => ({
          data: { user: null, session: null },
          error: {
            code: "email_not_confirmed",
            message: "Email not confirmed",
            status: 400,
          },
        }),
      }),
    );
    const result = await port.login(creds);
    expect(result.ok).toBe(false);
    if (!result.ok) {
      expect(result.message).toContain("Confirma tu email");
    }
  });

  it("email_not_confirmed → código propio para que la UI ofrezca confirmar (S3)", async () => {
    const port = createSupabaseAuthPort(
      fakeClient({
        signInWithPassword: async () => ({
          data: { user: null, session: null },
          error: {
            code: "email_not_confirmed",
            message: "Email not confirmed",
            status: 400,
          },
        }),
      }),
    );
    const result = await port.login(creds);
    expect(result).toMatchObject({ ok: false, code: "email_not_confirmed" });
  });

  it("otp_expired → código invalid_token con mensaje español (S4)", async () => {
    const port = createSupabaseAuthPort(
      fakeClient({
        verifyOtp: async () => ({
          data: { user: null, session: null },
          error: {
            code: "otp_expired",
            message: "Token has expired or is invalid",
            status: 403,
          },
        }),
      }),
    );
    const result = await port.confirmRegistration(confirmation);
    expect(result).toEqual({
      ok: false,
      code: "invalid_token",
      message: "El código es incorrecto o expiró. Pide uno nuevo.",
    });
  });

  it("código desconocido → fallback español, nunca el mensaje crudo en inglés", async () => {
    const port = createSupabaseAuthPort(
      fakeClient({
        signUp: async () => ({
          data: { user: null, session: null },
          error: {
            code: "unexpected_db_error",
            message: "Database error saving new user",
            status: 500,
          },
        }),
      }),
    );
    const result = await port.register(creds);
    expect(result.ok).toBe(false);
    if (!result.ok) {
      expect(result.message).toBe("No se pudo crear la cuenta.");
      expect(result.message).not.toContain("Database error");
    }
  });
});

describe("createSupabaseAuthPort — confirmación por código (S1/S5)", () => {
  it("confirmRegistration usa verifyOtp con email, token y type 'signup'", async () => {
    const client = fakeClient({
      verifyOtp: async () => ({
        data: { user: { id: "user-1", email: "user@test.dev" }, session: {} },
        error: null,
      }),
    });
    const port = createSupabaseAuthPort(client);

    const result = await port.confirmRegistration(confirmation);

    expect(result).toEqual({
      ok: true,
      data: { id: "user-1", email: "user@test.dev" },
    });
    // El token va en el cuerpo, no en una URL: por eso no depende del
    // navegador donde se inició el registro.
    expect(client.auth.verifyOtp).toHaveBeenCalledWith({
      email: "user@test.dev",
      token: "123456",
      type: "signup",
    });
  });

  it("confirmRegistration falla controlado si Supabase no devuelve usuario", async () => {
    const port = createSupabaseAuthPort(
      fakeClient({
        verifyOtp: async () => ({
          data: { user: null, session: null },
          error: null,
        }),
      }),
    );

    const result = await port.confirmRegistration(confirmation);

    expect(result).toEqual({
      ok: false,
      code: "unknown",
      message: "No se pudo confirmar la cuenta.",
    });
  });

  it("resendConfirmation pide un código nuevo de tipo 'signup'", async () => {
    const client = fakeClient({ resend: async () => ({ error: null }) });
    const port = createSupabaseAuthPort(client);

    const result = await port.resendConfirmation("user@test.dev");

    expect(result).toEqual({ ok: true, data: undefined });
    expect(client.auth.resend).toHaveBeenCalledWith({
      type: "signup",
      email: "user@test.dev",
    });
  });

  it("resendConfirmation mapea el rate-limit a mensaje español", async () => {
    const port = createSupabaseAuthPort(
      fakeClient({
        resend: async () => ({
          error: {
            code: "over_email_send_rate_limit",
            message: "email rate limit exceeded",
            status: 429,
          },
        }),
      }),
    );

    const result = await port.resendConfirmation("user@test.dev");

    expect(result).toEqual({
      ok: false,
      code: "unknown",
      message: "Demasiados intentos. Inténtalo de nuevo en unos minutos.",
    });
  });
});
