# SPEC: 13 — Frontend: Dashboard & Pantry

**Source:** PROMTP.md #40 (Dashboard), #41 (Pantry), #45 (Pantry components), #83 Casos 2–3 (acceptance flows), #70 (Filter model — pantry inputs part).

## Purpose

Build the authenticated home (`/dashboard`) and the pantry manager (`/dashboard/pantry`): the screen where users declare their ingredients and launch recipe searches.

## Scope

### In scope
- Dashboard page: greeting, meal-type selector, available ingredients, optional cuisine selector, search button, recommendations display.
- Pantry page: search/add/edit/remove ingredients with quantity/unit, clear pantry.

### Out of scope
- Recipes list/detail/favorites pages (spec 14), recommendation algorithm (spec 10), shared components (spec 12), API routes (spec 11).

## Requirements

| ID | Requirement |
|----|-------------|
| REQ-01 | Dashboard route `/dashboard` (protected — redirect handled per spec 05) with: greeting, meal-type selector (`Desayuno/Almuerzo/Cena/Cualquier momento`), available-ingredients chips, optional cuisine selector (default `Todas`), **Encontrar recetas** button, and recommendation results. |
| REQ-02 | Pantry route `/dashboard/pantry` with components `IngredientSearch`, `IngredientSelector`, `PantryList`, `PantryItem`. |
| REQ-03 | Pantry operations: search ingredient (case-insensitive), add, edit (quantity/unit), remove, clear pantry. |
| REQ-04 | Search submits `{ ingredientIds, mealType, cuisineId }` to the recommendations flow (spec 11 endpoint or direct use case per spec 02 hop rule). |
| REQ-05 | Results list renders shared `RecipeCard`s with `RecipeMatchScore` and missing-ingredient hints (components from spec 12). |
| REQ-06 | Filter model must be extensible: full model `ingredients, mealType, cuisine, maxPreparationTime, difficulty, diet`; MVP implements only `ingredients, mealType, cuisine` without locking the shape (#70). |
| REQ-07 | **Routing note:** the specified URLs (`/dashboard`, `/dashboard/pantry`) are authoritative. Next.js route groups do not affect URLs — structure folders so the final URLs match exactly (adapt PROMTP #9 folder layout if needed). |
| REQ-08 | Empty pantry → friendly `EmptyState` guiding the user to add ingredients; loading and error states on all data fetches. |

## Dependencies

- `12-frontend-foundation`, `07-application-layer`, `10-recommendation-engine` (results), `05-supabase-auth` (protection).

## Acceptance criteria

- [ ] `/dashboard` requires auth and shows all elements of REQ-01.
- [ ] Pantry CRUD works end-to-end against real data (add `papa`, `carne`, `huevo` → visible in list; edit/remove/clear work).
- [ ] Selecting meal type, no cuisine, and searching returns multi-cuisine results (Caso 2).
- [ ] With `cuisine = Peruana`, results are predominantly/only Peruvian (Caso 3).
- [ ] Final URLs are exactly `/dashboard` and `/dashboard/pantry`.

## Verification

E2E flows 3–6 of spec 16 (dashboard, add ingredients, select meal type, search recipes, view results).
