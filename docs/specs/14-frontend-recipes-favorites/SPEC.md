# SPEC: 14 — Frontend: Recipes, Detail & Favorites

**Source:** PROMTP.md #42 (Recipes), #43 (Recipe detail), #44 (Favorites), #45 (Recipe components), #70 (Filter model), #71 (Search results), #72 (Match score UI), #83 Casos 4/6 (acceptance).

## Purpose

Build the recipe discovery surfaces: results grid with filters and match explanation, the full recipe detail page, and the favorites list.

## Scope

### In scope
- `/dashboard/recipes` with filters (cuisine, meal type) and result cards.
- `/dashboard/recipes/[id]` detail view.
- `/dashboard/favorites` list with remove/search.
- Match-score UI that explains *why* a recipe was recommended.

### Out of scope
- Recommendation engine (spec 10), shared components (spec 12), favorites API (spec 11).

## Requirements

| ID | Requirement |
|----|-------------|
| REQ-01 | `/dashboard/recipes`: filters (cuisine, meal type), `RecipeCard` grid, per-card: match score, available ingredients, missing ingredients. Components: `MealTypeSelector`, `CuisineSelector`, `RecipeCard`, `RecipeGrid`, `RecipeMatchScore`, `MissingIngredients`. |
| REQ-02 | `/dashboard/recipes/[id]`: name, image, description, cuisine, country, region, ingredients with quantities, instructions, time, servings, difficulty, match score, available/missing ingredients, favorite button, source. |
| REQ-03 | `/dashboard/favorites`: favorite recipes list, search/filters when useful, remove favorite. |
| REQ-04 | Each result exposes `recipe, matchScore, availableIngredients, missingIngredients, optionalMissingIngredients` (#71) — JSON example shape from the PROMPT. |
| REQ-05 | Match score UI must be **understandable**: "92% de coincidencia" or "Tienes 5 de 6 ingredientes" — never only an abstract number; the user must understand *why* the recipe was recommended (#72). |
| REQ-06 | Filter model extensible (`maxPreparationTime`, `difficulty`, `diet` reserved); MVP ships `ingredients/mealType/cuisine` only (#70). |
| REQ-07 | Insufficient ingredients case (Caso 4): show available **and** missing ingredients clearly on cards and detail. |
| REQ-08 | Favorite button toggles optimistic/persistent state via favorites use cases; Caso 6: favorite persists in Supabase across sessions. |
| REQ-09 | Recipe detail must handle both internal and Spoonacular-sourced recipes transparently (show `source`; external failure states degrade gracefully per spec 09). |
| REQ-10 | Loading skeletons, empty states (no results, no favorites), error states everywhere. |

## Dependencies

- `12-frontend-foundation`, `13-frontend-dashboard-pantry` (search entry), `11-api-layer`, `10-recommendation-engine`.

## Acceptance criteria

- [ ] Searching from the dashboard lands on/renders results at `/dashboard/recipes` with filters working.
- [ ] Cards show percentage + available/missing ingredients (Caso 4).
- [ ] Detail page renders every field of REQ-02 for an internal and an external recipe.
- [ ] Favorite → persists (Caso 6); unfavorite removes it; `/dashboard/favorites` reflects state.
- [ ] Match score understandable in at least the two formats of REQ-05.

## Verification

E2E flows 7–10 of spec 16 (view results, view recipe, save favorite, consult favorites) + RTL tests for `RecipeMatchScore`.
