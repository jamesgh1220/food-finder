import { describe, expect, it } from "vitest";
import type { Cuisine } from "@/domain/entities";

describe("Cuisine como catálogo extensible", () => {
  it("acepta una cocina nueva solo con datos, sin cambios de código", () => {
    // Si Cuisine fuera un enum, este objeto no compilaría ni existiría sin
    // tocar el código. Es una entidad-catálogo data-driven.
    const nuevaCocina: Cuisine = {
      id: "cuisine-xx",
      name: "Nueva Cocina",
      slug: "nueva-cocina",
      country: "XX",
      region: "Región Nueva",
      description: "Cocina de prueba agregada solo con datos.",
      createdAt: new Date("2026-01-01T00:00:00.000Z"),
      updatedAt: new Date("2026-01-01T00:00:00.000Z"),
    };

    expect(nuevaCocina.slug).toBe("nueva-cocina");
    expect(nuevaCocina.country).not.toBe(nuevaCocina.name);
  });
});
