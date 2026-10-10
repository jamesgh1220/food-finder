import { render, screen } from "@testing-library/react";
import userEvent from "@testing-library/user-event";
import { describe, expect, it, vi } from "vitest";
import { EmptyState } from "@/components/shared/empty-state";
import { ErrorState } from "@/components/shared/error-state";
import { LoadingState } from "@/components/shared/loading-state";
import { messages } from "@/lib/i18n/messages";

describe("EmptyState", () => {
  it("renders the default Spanish copy from the i18n messages", () => {
    render(<EmptyState />);

    expect(
      screen.getByRole("heading", { name: messages.states.empty.title }),
    ).toBeInTheDocument();
    expect(
      screen.getByText(messages.states.empty.description),
    ).toBeInTheDocument();
  });

  it("allows overriding the title/description and injecting an action", () => {
    render(
      <EmptyState
        title="Sin recetas"
        description="Agrega ingredientes para empezar."
        action={<button type="button">Acción</button>}
      />,
    );

    expect(
      screen.getByRole("heading", { name: "Sin recetas" }),
    ).toBeInTheDocument();
    expect(
      screen.getByText("Agrega ingredientes para empezar."),
    ).toBeInTheDocument();
    expect(
      screen.getByRole("button", { name: "Acción" }),
    ).toBeInTheDocument();
  });
});

describe("LoadingState", () => {
  it("announces a polite busy status with the default label", () => {
    render(<LoadingState />);

    const status = screen.getByRole("status");
    expect(status).toHaveAttribute("aria-busy", "true");
    expect(status).toHaveTextContent(messages.states.loading);
  });

  it("accepts a custom label", () => {
    render(<LoadingState label="Cargando recetas" />);

    expect(screen.getByRole("status")).toHaveTextContent("Cargando recetas");
  });
});

describe("ErrorState", () => {
  it("renders the default error copy inside an assertive alert region", () => {
    render(<ErrorState />);

    const alert = screen.getByRole("alert");
    expect(alert).toHaveTextContent(messages.states.error.title);
    expect(alert).toHaveTextContent(messages.states.error.description);
  });

  // ErrorState intentionally has no `onRetry` prop: retrying needs
  // interactivity, so the caller supplies the control through `action`.
  it("delegates the retry affordance to the caller-provided action", async () => {
    const user = userEvent.setup();
    const onRetry = vi.fn();

    render(
      <ErrorState
        action={
          <button type="button" onClick={onRetry}>
            {messages.states.error.retry}
          </button>
        }
      />,
    );

    await user.click(
      screen.getByRole("button", { name: messages.states.error.retry }),
    );

    expect(onRetry).toHaveBeenCalledTimes(1);
  });
});
