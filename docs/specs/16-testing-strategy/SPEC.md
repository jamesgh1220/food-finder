# SPEC: 16 — Testing Strategy (Unit, Integration, E2E, Security)

**Source:** PROMTP.md #62 (Testing stack), #63 (Unit tests), #64 (Integration tests), #65 (Spoonacular testing), #66 (E2E tests), #67 (Security E2E), #96 (DoD — tests must pass).

## Purpose

Establish the testing pyramid for the project: Vitest + React Testing Library for unit/component tests, Playwright for E2E, plus security E2E — with Spoonacular always mocked in unit tests.

## Scope

### In scope
- Test tooling setup and suites: domain unit, application unit, integration, Spoonacular mock scenarios, E2E flows, security E2E.

### Out of scope
- Production implementation (specs 01–15); this spec defines and runs the verification.

## Requirements

| ID | Requirement |
|----|-------------|
| REQ-01 | Stack: **Vitest**, **React Testing Library**, **Playwright** (verify current compatible versions before install). |
| REQ-02 | **Domain unit tests** for: ingredient normalization, match score, recipe matching, pantry staples, meal type, cuisine filtering, optional ingredients. |
| REQ-03 | **Application unit tests** for: `FindRecipesFromPantry`, `AddPantryIngredient`, `RemovePantryIngredient`, favorites, cuisine retrieval — repositories/providers **mocked**. |
| REQ-04 | **Never** depend on real Spoonacular in unit tests. Create `MockExternalRecipeProvider` covering: success, timeout, 429, 500, malformed response, empty result. |
| REQ-05 | **Integration tests** for: Supabase repositories, RLS, API endpoints, auth, pantry persistence, favorites, recipe retrieval. |
| REQ-06 | **E2E tests (Playwright)** for the 11 flows: 1 register, 2 login, 3 dashboard, 4 add ingredients, 5 select meal type, 6 search recipes, 7 view results, 8 view recipe, 9 save favorite, 10 consult favorites, 11 logout. |
| REQ-07 | **Security E2E**: unauthenticated user cannot access the dashboard; user A cannot access user B's pantry; user A cannot modify user B's favorites; RLS actually works; endpoints validate authorization. |
| REQ-08 | All suites are part of the Definition of Done: `npm run test` and `npm run test:e2e` must pass for a release. |

## Dependencies

All feature specs (01–15) for what to test; tooling from spec 01.

## Acceptance criteria

- [ ] REQ-02 and REQ-03 suites exist and are green.
- [ ] `MockExternalRecipeProvider` covers all six scenarios of REQ-04.
- [ ] Integration suite exercises persistence + RLS against a real database.
- [ ] All 11 E2E flows pass in CI/local.
- [ ] All 5 security E2E checks pass with two distinct test users.
- [ ] Zero tests hit the real Spoonacular API.

## Verification

```bash
npm run test && npm run test:e2e
```
