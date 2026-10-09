import { vi } from "vitest";
import type {
  AuthPort,
  AuthResult,
  AuthUser,
} from "@/application/ports/auth";
import { authOk } from "@/application/ports/auth";
import type { PantryItem, Recipe } from "@/domain/entities";
import { Quantity, Unit } from "@/domain/value-objects";

/** Usuario de sesión de prueba usado por todos los tests de aplicación. */
export const sessionUser: AuthUser = {
  id: "user-1",
  email: "ana@example.com",
};

/**
 * Puerto de auth falso: por defecto devuelve el usuario de sesión. Pasar
 * `null` simula una petición sin sesión (caso no autorizado).
 */
export function createFakeAuthPort(user: AuthUser | null = sessionUser): AuthPort {
  return {
    register: vi.fn(async () =>
      authOk({ user: sessionUser, sessionStarted: true }),
    ),
    login: vi.fn(async () => authOk(sessionUser)),
    logout: vi.fn(async () => authOk(undefined)),
    getCurrentUser: vi.fn(
      async (): Promise<AuthResult<AuthUser | null>> => authOk(user),
    ),
  } satisfies AuthPort;
}

/** Receta de catálogo con valores por defecto; sobrescribe lo necesario. */
export function makeRecipe(overrides: Partial<Recipe> = {}): Recipe {
  return {
    id: "recipe-1",
    name: "Tortilla de patatas",
    slug: "tortilla-de-patatas",
    description: null,
    cuisineId: "cuisine-es",
    country: null,
    region: null,
    mealType: "LUNCH",
    instructions: "Batir los huevos y cuajar con las patatas.",
    preparationTime: 10,
    cookingTime: 20,
    servings: 4,
    difficulty: "EASY",
    imageUrl: null,
    source: "INTERNAL",
    sourceUrl: null,
    createdAt: new Date("2026-01-01T00:00:00Z"),
    updatedAt: new Date("2026-01-01T00:00:00Z"),
    ...overrides,
  };
}

/** Fila de despensa con valores por defecto; sobrescribe lo necesario. */
export function makePantryItem(
  overrides: Partial<PantryItem> = {},
): PantryItem {
  return {
    id: "pantry-1",
    userId: sessionUser.id,
    ingredientId: "ing-1",
    quantity: Quantity.create(1),
    unit: Unit.create("g"),
    createdAt: new Date("2026-01-01T00:00:00Z"),
    updatedAt: new Date("2026-01-01T00:00:00Z"),
    ...overrides,
  };
}
