import type { MealType } from "@/domain/value-objects";

/**
 * Centralized Spanish UI copy (spec 12, REQ-07; PROMTP #51).
 *
 * Every user-facing string the shared components and the landing page render
 * lives here so the app can later swap this module for a real i18n backend
 * (es/en/pt/fr) without touching component code. Domain enums are mapped to
 * display labels instead of being hard-coded across the tree.
 *
 * UI copy is Spanish; identifiers and comments stay in English.
 */

export const mealTypeLabels: Record<MealType, string> = {
  BREAKFAST: "Desayuno",
  LUNCH: "Almuerzo",
  DINNER: "Cena",
  SNACK: "Merienda",
  DESSERT: "Postre",
  ANY: "Cualquier momento",
};

/** Meal types shown by default in the MVP dashboard (PROMTP #40). */
export const defaultMealTypes: MealType[] = [
  "BREAKFAST",
  "LUNCH",
  "DINNER",
  "ANY",
];

export const difficultyLabels: Record<"EASY" | "MEDIUM" | "HARD", string> = {
  EASY: "Fácil",
  MEDIUM: "Media",
  HARD: "Difícil",
};

export const recipeSourceLabels: Record<string, string> = {
  INTERNAL: "Receta propia",
  AI_GENERATED: "Generada con IA",
  SPOONACULAR: "Externa",
  OTHER: "Externa",
};

export const messages = {
  appName: "Food Finder",
  landing: {
    hero: {
      headline: "¿Qué puedo cocinar con lo que tengo?",
      subheadline:
        "Dinos qué tienes en casa y te mostramos qué puedes cocinar hoy, con las recetas que mejor encajan.",
      primaryCta: "Comenzar",
      secondaryCta: "Iniciar sesión",
      eyebrow: "Cocina con lo que ya tienes",
    },
    examples: {
      title: "Así se ve una recomendación",
      description:
        "Cada receta explica por qué te la proponemos: coincidencia y qué ingredientes te faltan.",
    },
    steps: {
      title: "Cómo funciona",
      items: [
        {
          title: "Agrega tus ingredientes",
          description:
            "Registra lo que tienes en casa, con cantidad y unidad, en tu despensa.",
        },
        {
          title: "Elige qué quieres comer",
          description:
            "Desayuno, almuerzo, cena o cualquier momento, y tu cocina preferida.",
        },
        {
          title: "Descubre recetas",
          description:
            "Te mostramos qué puedes cocinar, qué te falta y por qué encaja cada receta.",
        },
        {
          title: "Guarda tus favoritas",
          description:
            "Guarda las recetas que te gustan para volver a encontrarlas cuando quieras.",
        },
      ],
    },
    closing: {
      title: "Tu despensa, convertida en ideas",
      primaryCta: "Comenzar",
    },
  },
  mealTypes: {
    label: "Tipo de comida",
    legend: "Tipo de comida",
  },
  cuisines: {
    label: "Cocina",
    all: "Todas",
  },
  pantry: {
    quantity: "Cantidad",
    unit: "Unidad",
    edit: "Editar",
    remove: "Eliminar",
    save: "Guardar",
    cancel: "Cancelar",
  },
  recipes: {
    availableLabel: "Ingredientes que ya tienes",
    missingLabel: "Ingredientes que te faltan",
    allAvailable: "Tienes todo lo necesario",
    optionalNote: "opcional",
  },
  favorites: {
    add: "Guardar en favoritos",
    remove: "Quitar de favoritos",
  },
  matchScore: {
    percentage: (percent: number) => `${percent}% de coincidencia`,
    ingredients: (available: number, total: number) =>
      `Tienes ${available} de ${total} ingredientes`,
  },
  states: {
    loading: "Cargando…",
    empty: {
      title: "Aquí no hay nada todavía",
      description: "Cuando agregues contenido, aparecerá en este lugar.",
    },
    error: {
      title: "Algo salió mal",
      description: "No pudimos cargar esta información. Inténtalo de nuevo.",
      retry: "Reintentar",
    },
    notFound: {
      title: "No encontramos resultados",
      description: "Prueba ajustando los filtros o agregando más ingredientes.",
    },
  },
} as const;
