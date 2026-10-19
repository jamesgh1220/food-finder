import { render, screen } from "@testing-library/react";
import userEvent from "@testing-library/user-event";
import { describe, expect, it, vi } from "vitest";
import { DashboardMobileNavigation } from "@/components/dashboard/dashboard-mobile-navigation";

vi.mock("next/navigation", () => ({
  useRouter: () => ({
    push: vi.fn(),
    refresh: vi.fn(),
  }),
}));

describe("DashboardMobileNavigation", () => {
  it("reveals the same navigation links and account controls when opened", async () => {
    const user = userEvent.setup();

    render(<DashboardMobileNavigation email="ana@example.com" />);

    const toggle = screen.getByRole("button", { name: "Abrir menú" });
    expect(toggle).toHaveAttribute("aria-expanded", "false");
    expect(screen.queryByRole("link", { name: "Despensa" })).not.toBeInTheDocument();

    await user.click(toggle);

    expect(toggle).toHaveAttribute("aria-expanded", "true");
    expect(screen.getByRole("link", { name: "Despensa" })).toHaveAttribute(
      "href",
      "/dashboard/pantry",
    );
    expect(screen.getByRole("link", { name: "Recetas" })).toHaveAttribute(
      "href",
      "/dashboard/recipes",
    );
    expect(screen.getByRole("link", { name: "Favoritos" })).toHaveAttribute(
      "href",
      "/dashboard/favorites",
    );
    expect(screen.getByText("ana@example.com")).toBeInTheDocument();
    expect(screen.getByRole("button", { name: "Cerrar sesión" })).toBeInTheDocument();
  });

  it("closes after a navigation link is selected", async () => {
    const user = userEvent.setup();

    render(<DashboardMobileNavigation email="ana@example.com" />);

    await user.click(screen.getByRole("button", { name: "Abrir menú" }));
    await user.click(screen.getByRole("link", { name: "Recetas" }));

    expect(screen.getByRole("button", { name: "Abrir menú" })).toHaveAttribute(
      "aria-expanded",
      "false",
    );
    expect(screen.queryByRole("link", { name: "Recetas" })).not.toBeInTheDocument();
  });
});
