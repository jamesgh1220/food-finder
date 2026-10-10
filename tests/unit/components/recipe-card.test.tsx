import { render, screen } from "@testing-library/react";
import { describe, expect, it, vi } from "vitest";
import { RecipeCard } from "@/components/recipes/recipe-card";
import { mealTypeLabels, messages } from "@/lib/i18n/messages";
import { makeRecipe } from "./test-helpers";

vi.mock("next/image", async () => {
  const { MockImage } = await import("./test-helpers");
  return { default: MockImage };
});

vi.mock("next/link", async () => {
  const { MockLink } = await import("./test-helpers");
  return { default: MockLink };
});

describe("RecipeCard", () => {
  it("renders the recipe name and the meal-type badge", () => {
    render(
      <RecipeCard recipe={makeRecipe({ name: "Tortilla", mealType: "LUNCH" })} />,
    );

    expect(
      screen.getByRole("heading", { level: 3, name: "Tortilla" }),
    ).toBeInTheDocument();
    expect(screen.getByText(mealTypeLabels.LUNCH)).toBeInTheDocument();
  });

  it("derives the 'Tienes X de Y' wording from the ingredient lists", () => {
    render(
      <RecipeCard
        recipe={makeRecipe()}
        matchScore={0.99}
        availableIngredients={["Papa", "Huevo"]}
        missingIngredients={["Cebolla"]}
      />,
    );

    expect(
      screen.getByText(messages.matchScore.ingredients(2, 3)),
    ).toBeInTheDocument();
    // The raw match score must never be shown on its own.
    expect(
      screen.queryByText(messages.matchScore.percentage(99)),
    ).not.toBeInTheDocument();
  });

  it("collapses available chips beyond four into a +N badge", () => {
    render(
      <RecipeCard
        recipe={makeRecipe()}
        availableIngredients={[
          "Uno",
          "Dos",
          "Tres",
          "Cuatro",
          "Cinco",
          "Seis",
        ]}
      />,
    );

    for (const name of ["Uno", "Dos", "Tres", "Cuatro"]) {
      expect(screen.getByText(name)).toBeInTheDocument();
    }
    expect(screen.getByText("+2")).toBeInTheDocument();
    expect(screen.queryByText("Cinco")).not.toBeInTheDocument();
    expect(screen.queryByText("Seis")).not.toBeInTheDocument();
  });

  it("shows the missing ingredients under the missing label", () => {
    render(
      <RecipeCard recipe={makeRecipe()} missingIngredients={["Mozzarella"]} />,
    );

    expect(
      screen.getByText(messages.recipes.missingLabel),
    ).toBeInTheDocument();
    expect(screen.getByText("Mozzarella")).toBeInTheDocument();
  });

  it("wraps the title in a link when href is provided", () => {
    render(
      <RecipeCard
        recipe={makeRecipe({ name: "Tortilla" })}
        href="/dashboard/recipes/tortilla"
      />,
    );

    expect(
      screen.getByRole("link", { name: "Tortilla" }),
    ).toHaveAttribute("href", "/dashboard/recipes/tortilla");
  });

  it("renders a plain heading instead of a link when href is omitted", () => {
    render(<RecipeCard recipe={makeRecipe({ name: "Tortilla" })} />);

    expect(screen.queryByRole("link")).not.toBeInTheDocument();
    expect(
      screen.getByRole("heading", { level: 3, name: "Tortilla" }),
    ).toBeInTheDocument();
  });
});
