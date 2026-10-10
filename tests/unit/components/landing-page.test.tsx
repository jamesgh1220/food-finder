import { render, screen, within } from "@testing-library/react";
import { describe, expect, it, vi } from "vitest";
import LandingPage from "@/app/page";
import { messages } from "@/lib/i18n/messages";

vi.mock("next/image", async () => {
  const { MockImage } = await import("./test-helpers");
  return { default: MockImage };
});

vi.mock("next/link", async () => {
  const { MockLink } = await import("./test-helpers");
  return { default: MockLink };
});

describe("LandingPage", () => {
  it("renders the fixed headline as the page's single h1", () => {
    render(<LandingPage />);

    const heading = screen.getByRole("heading", { level: 1 });
    expect(heading).toHaveTextContent("¿Qué puedo cocinar con lo que tengo?");
  });

  it("links the primary 'Comenzar' CTA to /register and the secondary CTA to /login", () => {
    render(<LandingPage />);

    const hero = screen.getByRole("heading", { level: 1 }).closest("section");
    expect(hero).not.toBeNull();
    if (!hero) {
      throw new Error("hero section not found");
    }

    expect(
      within(hero).getByRole("link", { name: messages.landing.hero.primaryCta }),
    ).toHaveAttribute("href", "/register");
    expect(
      within(hero).getByRole("link", {
        name: messages.landing.hero.secondaryCta,
      }),
    ).toHaveAttribute("href", "/login");
  });

  it("renders exactly the four numbered steps from the i18n messages", () => {
    render(<LandingPage />);

    const stepsSection = screen
      .getByRole("heading", { name: messages.landing.steps.title })
      .closest("section");
    expect(stepsSection).not.toBeNull();
    if (!stepsSection) {
      throw new Error("steps section not found");
    }

    expect(messages.landing.steps.items).toHaveLength(4);

    const list = within(stepsSection).getByRole("list");
    expect(within(list).getAllByRole("listitem")).toHaveLength(
      messages.landing.steps.items.length,
    );

    messages.landing.steps.items.forEach((step, index) => {
      expect(
        within(stepsSection).getByRole("heading", {
          name: step.title,
          level: 3,
        }),
      ).toBeInTheDocument();
      expect(
        within(stepsSection).getByText(String(index + 1).padStart(2, "0")),
      ).toBeInTheDocument();
    });
  });
});
