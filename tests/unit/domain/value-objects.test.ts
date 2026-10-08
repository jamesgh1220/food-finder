import { describe, expect, it } from "vitest";
import { ValidationError } from "@/domain/errors";
import { IngredientName, Quantity, Unit } from "@/domain/value-objects";

describe("Quantity", () => {
  it("acepta 0 y decimales", () => {
    expect(Quantity.create(0).value).toBe(0);
    expect(Quantity.create(1.5).value).toBe(1.5);
  });

  it("rechaza negativos y NaN", () => {
    expect(() => Quantity.create(-1)).toThrow(ValidationError);
    expect(() => Quantity.create(NaN)).toThrow(ValidationError);
  });
});

describe("Unit", () => {
  it("recorta espacios alrededor del valor", () => {
    expect(Unit.create("  g  ").value).toBe("g");
  });

  it("rechaza cadenas vacías o solo espacios", () => {
    expect(() => Unit.create("")).toThrow(ValidationError);
    expect(() => Unit.create("   ")).toThrow(ValidationError);
  });
});

describe("IngredientName", () => {
  it("recorta espacios alrededor del valor", () => {
    expect(IngredientName.create("  Tomate  ").value).toBe("Tomate");
  });

  it("rechaza cadenas vacías o solo espacios", () => {
    expect(() => IngredientName.create("")).toThrow(ValidationError);
    expect(() => IngredientName.create("   ")).toThrow(ValidationError);
  });
});
