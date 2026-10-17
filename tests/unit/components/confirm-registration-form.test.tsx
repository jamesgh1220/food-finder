import { render, screen, waitFor } from "@testing-library/react";
import userEvent from "@testing-library/user-event";
import { beforeEach, describe, expect, it, vi } from "vitest";
import { authFail, authOk } from "@/application/ports/auth";
import { ConfirmRegistrationForm } from "@/components/auth/confirm-registration-form";

/**
 * ConfirmRegistrationForm behavior (spec 05, REQ-08; task S5).
 *
 * The resend control manages its own `isResending` flag instead of relying on
 * react-hook-form's `isSubmitting`, so a failure that escapes the AuthResult
 * envelope must not strand the button in its disabled "Enviando…" state.
 */

const confirmExecution = vi.hoisted(() => ({
  confirm: vi.fn(),
  resend: vi.fn(),
}));

vi.mock("next/navigation", () => ({
  useRouter: () => ({
    push: vi.fn(),
    refresh: vi.fn(),
    prefetch: vi.fn(),
    back: vi.fn(),
    forward: vi.fn(),
  }),
}));

vi.mock("@/lib/composition/browser-auth", () => ({
  createBrowserAuthServices: () => ({
    confirmRegistration: { execute: confirmExecution.confirm },
    resendConfirmation: { execute: confirmExecution.resend },
  }),
}));

const EMAIL = "ana@example.com";

beforeEach(() => {
  vi.clearAllMocks();
});

describe("ConfirmRegistrationForm — reenviar código (S5)", () => {
  it("does not strand the resend button when the auth call throws", async () => {
    const user = userEvent.setup();
    confirmExecution.resend.mockRejectedValue(new Error("connection failed"));

    render(<ConfirmRegistrationForm defaultEmail={EMAIL} />);
    await user.click(screen.getByRole("button", { name: "Reenviar código" }));

    await waitFor(() => {
      expect(screen.getByRole("alert")).toHaveTextContent(
        "No se pudo reenviar el código. Inténtalo de nuevo.",
      );
    });

    expect(
      screen.queryByRole("button", { name: "Enviando…" }),
    ).not.toBeInTheDocument();
    expect(
      screen.getByRole("button", { name: "Reenviar código" }),
    ).toBeEnabled();
  });

  it("surfaces a controlled AuthResult failure without stranding the button", async () => {
    const user = userEvent.setup();
    confirmExecution.resend.mockResolvedValue(
      authFail(
        "unknown",
        "Demasiados intentos. Inténtalo de nuevo en unos minutos.",
      ),
    );

    render(<ConfirmRegistrationForm defaultEmail={EMAIL} />);
    await user.click(screen.getByRole("button", { name: "Reenviar código" }));

    await waitFor(() => {
      expect(screen.getByRole("alert")).toHaveTextContent("Demasiados intentos");
    });
    expect(
      screen.getByRole("button", { name: "Reenviar código" }),
    ).toBeEnabled();
  });

  it("asks for a new code with the email typed in the form", async () => {
    const user = userEvent.setup();
    confirmExecution.resend.mockResolvedValue(authOk(undefined));

    render(<ConfirmRegistrationForm defaultEmail="" />);
    await user.type(screen.getByLabelText("Email"), EMAIL);
    await user.click(screen.getByRole("button", { name: "Reenviar código" }));

    await waitFor(() => {
      expect(confirmExecution.resend).toHaveBeenCalledWith(EMAIL);
    });
    expect(
      await screen.findByText("Te enviamos un código nuevo. Revisa tu email."),
    ).toBeInTheDocument();
  });

  it("does not spend a resend on an email that fails the schema", async () => {
    const user = userEvent.setup();

    render(<ConfirmRegistrationForm defaultEmail="no-es-email" />);
    await user.click(screen.getByRole("button", { name: "Reenviar código" }));

    await waitFor(() => {
      expect(screen.getByRole("alert")).toHaveTextContent(
        "Introduce un email válido.",
      );
    });
    expect(confirmExecution.resend).not.toHaveBeenCalled();
    expect(
      screen.getByRole("button", { name: "Reenviar código" }),
    ).toBeEnabled();
  });
});
