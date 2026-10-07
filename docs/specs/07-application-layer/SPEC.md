# SPEC: 07 — Application Layer (Use Cases & DTOs)

**Source:** PROMTP.md #13 (Use cases), #8 (Application responsibilities), #73 (Future AI port), #87 (Future user preferences), #88 (API design principle — use-case framing).

## Purpose

Implement the 16 application use cases with DTOs, coordination of repositories/services, use-case-level authorization, and forward-compatible extension points (AI enhancer, user preferences) that are **designed but not implemented** in the MVP.

## Scope

### In scope
- Use cases: Auth (4), Pantry (5), Recipes (4), Cuisine (2), Favorites (3).
- DTOs and orchestration rules.
- Conceptual ports reserved for future AI and user preferences.

### Out of scope
- Recommendation service internals (spec 10), API exposure (spec 11), repository implementations (spec 08).

## Requirements

| ID | Requirement |
|----|-------------|
| REQ-01 | **Auth**: `RegisterUser`, `LoginUser`, `LogoutUser`, `GetCurrentUser`. |
| REQ-02 | **Pantry**: `AddPantryIngredient`, `RemovePantryIngredient`, `UpdatePantryIngredient`, `GetUserPantry`, `ClearUserPantry`. |
| REQ-03 | **Recipes**: `FindRecipesFromPantry`, `GetRecipeById`, `SearchRecipes`, `GetRecipesByMealType`. |
| REQ-04 | **Cuisine**: `GetCuisines`, `GetCuisineById`. |
| REQ-05 | **Favorites**: `AddFavoriteRecipe`, `RemoveFavoriteRecipe`, `GetFavoriteRecipes`. |
| REQ-06 | Application layer owns: DTOs, coordination, orchestration of repositories and services, and **authorization at use-case level** (never trust the UI alone). |
| REQ-07 | Use cases depend only on ports/interfaces; concrete adapters are injected via the composition root. |
| REQ-08 | `FindRecipesFromPantry` must **not** treat `cuisine` as a mandatory filter (default `ALL`). |
| REQ-09 | Design-only extension points (no MVP implementation): conceptual port `RecipeRecommendationEnhancer` (future LLM/AI provider flow) and a future `UserPreferences` input shape (`preferredCuisines, excludedIngredients, diet, allergies, maxPreparationTime, difficulty, budget`). Document them; do not build them. |
| REQ-10 | APIs/cases represent real use cases — no CRUD-only endpoints invented for their own sake (enforced in spec 11). |

## Dependencies

- `06-domain-layer`, `02-architecture-foundation`.

## Acceptance criteria

- [ ] All 16 use cases exist, are independently unit-testable with mocked ports, and cover authorization checks for user-owned data.
- [ ] No use case imports Supabase/Spoonacular/Next.js.
- [ ] `FindRecipesFromPantry` with no cuisine returns cross-cuisine results (cuisine optional).
- [ ] Extension points from REQ-09 exist as documented interfaces/stubs only — zero AI logic shipped.

## Verification

Unit tests per use case with mocked repositories (application suite in spec 16).
