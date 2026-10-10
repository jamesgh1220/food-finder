import type {
  AnchorHTMLAttributes,
  ImgHTMLAttributes,
  ReactNode,
} from "react";
import type { Ingredient, Recipe } from "@/domain/entities";

/**
 * Shared test doubles and fixtures for the component tests (spec 12).
 *
 * `MockImage`/`MockLink` replace `next/image` and `next/link` in jsdom. Both
 * drop the Next-only props so nothing unsupported leaks onto the DOM. They are
 * referenced from `vi.mock` factories through a dynamic import, which keeps the
 * hoisted factory free of top-level variable references.
 */

/** `next/image` props that must never reach a plain `<img>`. */
export function MockImage({
  fill,
  priority,
  sizes,
  ...rest
}: ImgHTMLAttributes<HTMLImageElement> & {
  fill?: boolean;
  priority?: boolean;
  sizes?: string;
}) {
  // Intentionally dropped: these are Next.js-only attributes.
  void fill;
  void priority;
  void sizes;
  // Test double: `alt` is forwarded from the component under test via `rest`.
  // eslint-disable-next-line @next/next/no-img-element, jsx-a11y/alt-text
  return <img {...rest} />;
}

/** Minimal `next/link` replacement that renders a real anchor. */
export function MockLink({
  children,
  href,
  ...rest
}: AnchorHTMLAttributes<HTMLAnchorElement> & {
  children?: ReactNode;
  href: string;
}) {
  return (
    <a href={href} {...rest}>
      {children}
    </a>
  );
}

const NOW = new Date("2026-01-01T00:00:00.000Z");

/** Deterministic `Recipe` factory with sensible defaults. */
export function makeRecipe(overrides: Partial<Recipe> = {}): Recipe {
  return {
    id: "recipe-1",
    name: "Tortilla de patatas",
    slug: "tortilla-de-patatas",
    description: null,
    cuisineId: "general",
    country: null,
    region: null,
    mealType: "LUNCH",
    instructions: "",
    preparationTime: 20,
    cookingTime: 0,
    servings: 2,
    difficulty: "EASY",
    imageUrl: null,
    source: "INTERNAL",
    sourceUrl: null,
    createdAt: NOW,
    updatedAt: NOW,
    ...overrides,
  };
}

/** Deterministic `Ingredient` factory with sensible defaults. */
export function makeIngredient(overrides: Partial<Ingredient> = {}): Ingredient {
  return {
    id: "ingredient-1",
    name: "Tomate",
    normalizedName: "tomate",
    category: null,
    isPantryStaple: false,
    createdAt: NOW,
    updatedAt: NOW,
    ...overrides,
  };
}
