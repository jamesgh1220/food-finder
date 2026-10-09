/**
 * Barril de la capa application (spec 07).
 *
 * Reexporta los puntos de extensión futuros, el helper de autorización, los
 * nuevos casos de uso y sus DTOs para que las capas externas (composition
 * root, API de la spec 11 y UI de las specs 12–14) dependan de `@/application`
 * sin conocer la estructura interna de carpetas.
 *
 * No reexporta `@/application/auth/*` para no romper los deep imports ya
 * existentes de la spec 05; esos siguen funcionando igual.
 */
export * from "./ports/user-preferences";
export * from "./ports/recipe-recommendation";
export * from "./ports/recipe-recommendation-enhancer";
export * from "./ports/external-recipe-provider";
export * from "./shared/require-authenticated-user";

export * from "./pantry/add-pantry-ingredient";
export * from "./pantry/update-pantry-ingredient";
export * from "./pantry/remove-pantry-ingredient";
export * from "./pantry/get-user-pantry";
export * from "./pantry/clear-user-pantry";

export * from "./recipes/find-recipes-from-pantry";
export * from "./recipes/get-recipe-by-id";
export * from "./recipes/search-recipes";
export * from "./recipes/get-recipes-by-meal-type";

export * from "./cuisine/get-cuisines";
export * from "./cuisine/get-cuisine-by-id";

export * from "./favorites/add-favorite-recipe";
export * from "./favorites/remove-favorite-recipe";
export * from "./favorites/get-favorite-recipes";
