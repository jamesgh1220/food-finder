import { readFileSync } from "node:fs";
import { join } from "node:path";
import { describe, expect, expectTypeOf, it } from "vitest";
import type { RecommendedRecipe } from "@/application/ports/recipe-recommendation";
import type {
  RecipeRecommendationEnhancer,
  RecommendationEnhancementInput,
} from "@/application/ports/recipe-recommendation-enhancer";
import type { UserPreferences } from "@/application/ports/user-preferences";

const PORTS_DIR = join(process.cwd(), "src", "application", "ports");

/**
 * Puntos de extensión (spec 07 REQ-09): los contratos de IA y preferencias
 * existen SOLO como diseño. Este test comprueba que compilan a nivel de tipos
 * y que en el MVP no se envía ninguna implementación (sin clases ni lógica).
 */
describe("puntos de extensión — solo diseño, cero lógica", () => {
  it("UserPreferences es una forma de datos con filtros futuros opcionales", () => {
    expectTypeOf<UserPreferences>().toBeObject();
  });

  it("RecipeRecommendationEnhancer expone enhance sobre RecommendedRecipe[]", () => {
    expectTypeOf<RecipeRecommendationEnhancer["enhance"]>().toBeFunction();
    expectTypeOf<
      Parameters<RecipeRecommendationEnhancer["enhance"]>[0]
    >().toEqualTypeOf<RecommendationEnhancementInput>();
    expectTypeOf<
      ReturnType<RecipeRecommendationEnhancer["enhance"]>
    >().toEqualTypeOf<Promise<RecommendedRecipe[]>>();
  });

  it("los archivos de extensión no declaran implementaciones (solo interfaces)", () => {
    for (const file of [
      "user-preferences.ts",
      "recipe-recommendation-enhancer.ts",
    ]) {
      const source = readFileSync(join(PORTS_DIR, file), "utf8");
      expect(source, `${file} declara una clase`).not.toMatch(/\bclass\s+\w/);
      expect(source, `${file} declara una función`).not.toMatch(
        /\bfunction\s+\w/,
      );
    }
  });
});