# SPEC: 09 — Spoonacular Adapter (Port, Client, Mapping, Failure Handling)

**Source:** PROMTP.md #26 (Spoonacular port), #27 (Adapter), #28 (Endpoints), #29 (Mapping), #30 (Recipe source), #32 (Failure handling), #95 (Verify current docs).

## Purpose

Integrate Spoonacular as a complementary external recipe provider behind the `ExternalRecipeProvider` port: HTTP client with timeout/retries/rate handling, DTO mapping, and graceful failure so Spoonacular is **never a single point of failure**.

## Scope

### In scope
- `ExternalRecipeProvider` port + `SpoonacularRecipeProvider` adapter under `src/infrastructure/spoonacular/`.
- Endpoint selection verified against current Spoonacular docs.
- DTO → domain mapping pipeline.
- Failure handling (429/timeout/5xx/invalid/empty) with internal-results fallback.
- Server-only API key.

### Out of scope
- Recommendation flow orchestration/dedup/merge (spec 10), rate limiting of our own API (spec 11), mock provider tests (spec 16).

## Requirements

| ID | Requirement |
|----|-------------|
| REQ-01 | Define port `ExternalRecipeProvider` with at least `searchByIngredients(...)` and `getRecipeById(...)`; the domain must not know Spoonacular. |
| REQ-02 | Adapter at `src/infrastructure/spoonacular/` with `client/`, `mappers/`, `providers/`; implement `SpoonacularRecipeProvider`. |
| REQ-03 | Client responsibilities: base URL, API key, HTTP, **timeout**, retries when appropriate, error classification, rate limiting awareness, response parsing. |
| REQ-04 | API key `SPOONACULAR_API_KEY` server-side only; never `NEXT_PUBLIC_SPOONACULAR_API_KEY`. |
| REQ-05 | Before implementing, verify current Spoonacular documentation: endpoints for ingredient search, detailed recipe info, advanced search, cuisine filters, meal-type filters, preparation time, diet/intolerances when available. No obsolete endpoints. |
| REQ-06 | Mapping pipeline — never return raw Spoonacular JSON to the frontend: `Spoonacular DTO → Spoonacular Mapper → Application DTO → Domain/Application model → API Response`. |
| REQ-07 | Recipes carry `source = SPOONACULAR` (and external id/URL) so future providers can be added via `Recipe.source`. |
| REQ-08 | Failure handling: on 429, timeout, 500, outage, quota exceeded, or invalid response the application **keeps working**; if internal results exist, show them; never surface technical errors (no "AxiosError 429…" to users). Friendly message e.g. *"No pudimos consultar algunas recetas externas, pero encontramos estas opciones con tus ingredientes."* (UI copy localizable — see spec 12). |
| REQ-09 | `SpoonacularRecipeProvider` must be replaceable in tests with `MockExternalRecipeProvider` (no real API in unit tests — spec 16). |

## Dependencies

- `06-domain-layer`, `02-architecture-foundation`, `01-project-scaffold` (env vars), `07-application-layer` (consumers).

## Acceptance criteria

- [ ] The application compiles and runs with the Spoonacular key removed/endpoint down: internal recipes still return (no crash, no raw error to users).
- [ ] No Spoonacular JSON shape appears outside `src/infrastructure/spoonacular/`.
- [ ] Timeout enforced on every external call.
- [ ] Endpoint list verified against current official docs (reference recorded in the PR).

## Verification

Unit tests via `MockExternalRecipeProvider` (success, timeout, 429, 500, malformed, empty) in spec 16 + manual kill-the-network smoke test.
