import { describe, expect, it } from "vitest";
import { ValidationError } from "@/domain/errors";
import { MEAL_TYPES, isMealType, parseMealType } from "@/domain/value-objects";

describe("MealType", () => {
  it("acepta exactamente los 6 valores definidos", () => {
    expect(MEAL_TYPES).toHaveLength(6);

    for (const value of MEAL_TYPES) {
      expect(isMealType(value)).toBe(true);
      expect(parseMealType(value)).toBe(value);
    }
  });

  it("rechaza valores fuera del conjunto", () => {
    for (const value of ["BRUNCH", "", null, 42]) {
      expect(isMealType(value)).toBe(false);
      expect(() => parseMealType(value)).toThrow(ValidationError);
    }
  });
});
