import { describe, expect, it } from "vitest";
import { normalizeIngredientName } from "@/domain/normalization";

describe("normalizeIngredientName", () => {
  it("mapea las variantes de mayúsculas y espacios al mismo resultado", () => {
    const variants = ["Tomate", "tomate", "TOMATE", "  tomate  "];

    const normalized = variants.map((value) => normalizeIngredientName(value));

    expect(new Set(normalized).size).toBe(1);
    expect(normalized[0]).toBe("tomate");
  });

  it("colapsa los espacios internos a uno solo", () => {
    expect(normalizeIngredientName("  aceite   de   oliva  ")).toBe(
      "aceite de oliva",
    );
  });

  it("devuelve cadena vacía para entradas vacías o solo espacios", () => {
    expect(normalizeIngredientName("")).toBe("");
    expect(normalizeIngredientName("   ")).toBe("");
  });

  it("permite inyectar un pipeline personalizado (punto de extensión)", () => {
    // Un solo paso: sin minúsculas ni colapso de espacios.
    const result = normalizeIngredientName("AGUACATE   FRESCO", [
      (input) => input.trim(),
    ]);

    expect(result).toBe("AGUACATE   FRESCO");
  });
});
