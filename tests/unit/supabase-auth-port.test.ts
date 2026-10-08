import { describe, expect, it, vi } from "vitest";
import type { SupabaseClient } from "@supabase/supabase-js";
import { createSupabaseAuthPort } from "@/infrastructure/auth/supabase-auth-port";

type AuthErrorLike = { message: string; status: number; code?: string };

function fakeClient(overrides: {
  signUp?: () => Promise<{ data: unknown; error: AuthErrorLike | null }>;
  signInWithPassword?: () => Promise<{ data: unknown; error: AuthErrorLike | null }>;
}) {
  return {
    auth: {
      signUp: overrides.signUp ?? vi.fn(),
      signInWithPassword: overrides.signInWithPassword ?? vi.fn(),
      signOut: vi.fn(),
      getUser: vi.fn(),
    },
  } as unknown as SupabaseClient;
}

const creds = { email: "user@test.dev", password: "secret123" };

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

  it("email_not_confirmed → mensaje español", async () => {
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
