import { describe, expect, it } from "vitest";
import { ValidationError } from "@/domain/errors";
import { RecipeMatchScore } from "@/domain/value-objects";

describe("RecipeMatchScore", () => {
  it("acepta los límites inclusivos 0 y 1", () => {
    expect(RecipeMatchScore.create(0).value).toBe(0);
    expect(RecipeMatchScore.create(1).value).toBe(1);
  });

  it("rechaza valores fuera de rango o no finitos", () => {
    for (const value of [-0.01, 1.01, NaN, Infinity]) {
      expect(() => RecipeMatchScore.create(value)).toThrow(ValidationError);
    }
  });

  it("compara por valor con equals", () => {
    expect(RecipeMatchScore.create(0.5).equals(RecipeMatchScore.create(0.5))).toBe(
      true,
    );
    expect(RecipeMatchScore.create(0.5).equals(RecipeMatchScore.create(0.6))).toBe(
      false,
    );
  });
});
