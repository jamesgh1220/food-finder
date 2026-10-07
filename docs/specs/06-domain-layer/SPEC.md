# SPEC: 06 — Domain Layer (Entities, Value Objects, Ports, Errors, Normalization)

**Source:** PROMTP.md #10 (Entities), #11 (Value objects), #12 (Repository ports), #37 (Error types — domain part), #50 (Ingredient normalization), #84/#85 (Cuisine rules), #15 (match score VO).

## Purpose

Create the technology-independent domain: entities, value objects, repository port interfaces, domain errors, and ingredient normalization — with `Cuisine` as an extensible entity, never a rigid enum.

## Scope

### In scope
- Six entities with the exact conceptual fields of PROMTP #10.
- Value objects: `IngredientName`, `MealType`, `Quantity`, `Unit`, `RecipeMatchScore`.
- Repository port interfaces.
- Domain error taxonomy.
- Ingredient normalization rules.

### Out of scope
- Use cases (spec 07), matching/recommendation logic (spec 10), DB rows/mappers (specs 03/08), HTTP error mapping (spec 11).

## Requirements

| ID | Requirement |
|----|-------------|
| REQ-01 | **Recipe**: `id, name, slug, description, cuisineId, country, region, mealType, instructions, preparationTime, cookingTime, servings, difficulty, imageUrl, source, sourceUrl, timestamps`. `source` ∈ `INTERNAL \| SPOONACULAR \| AI_GENERATED \| OTHER` (only INTERNAL/SPOONACULAR used now; the other values must not require schema/code redesign later). |
| REQ-02 | **Cuisine**: `id, name, slug, country, region, description, createdAt, updatedAt`. Extensible catalog entity — **never** a rigid enum; new cuisines added via data only. |
| REQ-03 | **Ingredient**: `id, name, normalizedName, category, isPantryStaple, createdAt, updatedAt`. |
| REQ-04 | **RecipeIngredient**: `recipeId, ingredientId, quantity, unit, optional, notes`. |
| REQ-05 | **PantryItem**: `id, userId, ingredientId, quantity, unit, createdAt, updatedAt`. |
| REQ-06 | **FavoriteRecipe**: `userId, recipeId, createdAt`. |
| REQ-07 | Value objects: `IngredientName`, `MealType` (`BREAKFAST \| LUNCH \| DINNER \| SNACK \| DESSERT \| ANY`), `Quantity`, `Unit`, `RecipeMatchScore`. |
| REQ-08 | Repository port interfaces, Supabase-independent: `RecipeRepository`, `IngredientRepository`, `CuisineRepository`, `PantryRepository`, `FavoriteRepository`, `UserRepository`. Domain/application never know the persistence technology. |
| REQ-09 | Domain errors: `DomainError`, `ValidationError`, `UnauthorizedError`, `ForbiddenError`, `NotFoundError`, `ConflictError`, `ExternalServiceError`, `RepositoryError` (HTTP mapping happens in spec 11, not here). |
| REQ-10 | Ingredient normalization: `Tomate` / `tomate` / `TOMATE` map to the same ingredient (case-insensitive via `normalizedName`). Architecture must leave room for synonyms/translations/plurals/regional names (`aguacate/avocado/palta`) — **no NLP** in the MVP. |
| REQ-11 | Domain files import no framework, database or external HTTP code (rule enforced by spec 02). |

## Dependencies

- `02-architecture-foundation`, `01-project-scaffold`.

## Acceptance criteria

- [ ] All six entities and five value objects exist with exactly the fields/values above.
- [ ] Compiling the domain requires no Supabase/Spoonacular/Next.js/React packages.
- [ ] Repository ports are pure interfaces usable with mocks.
- [ ] Normalization unit tests: case variants resolve to one ingredient.
- [ ] Adding a cuisine requires zero code change (data-driven).

## Verification

Unit tests for normalization, `MealType`, `RecipeMatchScore`; import-boundary audit for REQ-11.
