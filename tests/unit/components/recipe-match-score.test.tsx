import { render, screen } from "@testing-library/react";
import { describe, expect, it } from "vitest";
import {
  describeMatchScore,
  RecipeMatchScore,
} from "@/components/recipes/recipe-match-score";
import { messages } from "@/lib/i18n/messages";

describe("describeMatchScore", () => {
  it("always explains a percentage in words", () => {
    const label = describeMatchScore(0.92);

    expect(label).toBe(messages.matchScore.percentage(92));
    expect(label).toContain("de coincidencia");
    expect(label).not.toBe("92");
  });

  it("prefers the ingredient wording when both counts are known", () => {
    const label = describeMatchScore(0.8, {
      availableCount: 5,
      totalCount: 6,
    });

    expect(label).toBe(messages.matchScore.ingredients(5, 6));
    expect(label).toContain("ingredientes");
  });

  it("honours an explicit percentage variant even when counts are known", () => {
    expect(
      describeMatchScore(0.8, {
        availableCount: 5,
        totalCount: 6,
        variant: "percentage",
      }),
    ).toBe(messages.matchScore.percentage(80));
  });

  it("honours an explicit ingredients variant", () => {
    expect(
      describeMatchScore(0.8, {
        availableCount: 2,
        totalCount: 4,
        variant: "ingredients",
      }),
    ).toBe(messages.matchScore.ingredients(2, 4));
  });

  it("falls back to the percentage when the ingredients variant has no counts", () => {
    expect(describeMatchScore(0.5, { variant: "ingredients" })).toBe(
      messages.matchScore.percentage(50),
    );
  });

  it("clamps out-of-range and non-finite scores", () => {
    expect(describeMatchScore(1.5)).toBe(messages.matchScore.percentage(100));
    expect(describeMatchScore(-1)).toBe(messages.matchScore.percentage(0));
    expect(describeMatchScore(Number.NaN)).toBe(
      messages.matchScore.percentage(0),
    );
  });
});

describe("RecipeMatchScore", () => {
  it("renders the explanation, never a bare number", () => {
    render(<RecipeMatchScore score={0.92} />);

    expect(
      screen.getByText(messages.matchScore.percentage(92)),
    ).toBeInTheDocument();
    expect(screen.queryByText("92")).not.toBeInTheDocument();
  });

  it("renders the ingredient wording when the counts are provided", () => {
    render(<RecipeMatchScore score={0.8} availableCount={5} totalCount={6} />);

    expect(
      screen.getByText(messages.matchScore.ingredients(5, 6)),
    ).toBeInTheDocument();
  });
});
