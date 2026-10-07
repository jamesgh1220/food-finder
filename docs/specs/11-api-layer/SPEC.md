# SPEC: 11 — API Layer (Route Handlers, Validation, Response Envelope, Errors, Rate Limiting)

**Source:** PROMTP.md #34 (API endpoints), #35 (Validation), #36 (API response), #37 (Error types → HTTP), #55 (Rate limiting), #71 (Search results response), #88 (API design principle).

## Purpose

Expose use cases through Next.js Route Handlers with the exact endpoint set, Zod validation, a uniform success/error envelope, correct HTTP error mapping, and rate limiting on the recommendation endpoint.

## Scope

### In scope
- All 12 endpoints, Zod validation, response envelope, error→HTTP mapping, rate limiting.
- Authorization on every user-data endpoint.

### Out of scope
- Use-case logic (spec 07), recommendation internals (spec 10), frontend consumption (specs 12–14).

## Requirements

| ID | Requirement |
|----|-------------|
| REQ-01 | Endpoints (minimum): `GET /api/recipes`, `GET /api/recipes/[id]`, `POST /api/recipes/recommendations`, `GET /api/ingredients`, `GET /api/ingredients/search`, `GET /api/cuisines`, `GET /api/pantry`, `POST /api/pantry`, `PATCH /api/pantry/[id]`, `DELETE /api/pantry/[id]`, `GET /api/favorites`, `POST /api/favorites`, `DELETE /api/favorites/[recipeId]`. |
| REQ-02 | APIs represent real use cases — no unnecessary CRUD-only endpoints (#88). |
| REQ-03 | Zod validation for query params, request body, route params, IDs, filters, quantities, units. Never trust client input directly. |
| REQ-04 | Success envelope: `{"success": true, "data": {}}`. Error envelope: `{"success": false, "error": {"code", "message", "details"}}` (e.g. `VALIDATION_ERROR`). |
| REQ-05 | Error → HTTP mapping: 400 Validation, 401 Unauthorized, 403 Forbidden, 404 Not Found, 409 Conflict, 429 Rate Limit, 500 Internal, 502 External Service. |
| REQ-06 | Never expose stack traces, API keys, secrets, internal details, SQL or sensitive info in responses. |
| REQ-07 | `POST /api/recipes/recommendations` accepts `{ ingredientIds: [], mealType: "LUNCH", cuisineId: null }` and returns results in the spec-10 shape (`recipe`, `matchScore`, `availableIngredients`, `missingIngredients`, `optionalMissingIngredients`) inside the success envelope. |
| REQ-08 | Rate limiting on endpoints that can trigger Spoonacular calls — especially `POST /api/recipes/recommendations` — so one user cannot generate thousands of external requests. Simple strategy compatible with the environment; **no Redis** just for this. |
| REQ-09 | Authentication/authorization enforced on all user-data endpoints (pantry, favorites): unauthenticated → 401; other-user resource → 403/404 per policy; RLS remains the backstop. |
| REQ-10 | Route Handlers are the integration surface for external clients/APIs; Server Components may call use cases directly instead (spec 02, REQ-11). |

## Dependencies

- `07-application-layer`, `10-recommendation-engine`, `06-domain-layer` (errors), `04-security-rls`.

## Acceptance criteria

- [ ] Every endpoint in REQ-01 responds with the correct envelope and status codes.
- [ ] Invalid body/query/param → 400 with `VALIDATION_ERROR` and `details`.
- [ ] Unauthenticated pantry/favorites request → 401; cross-user write attempt → blocked (RLS/authorization).
- [ ] Rapid-fire recommendations requests exceed threshold → 429.
- [ ] Grep of error paths shows no stack traces/secrets/SQL.

## Verification

Unit tests with mocked use cases per route + integration tests hitting real handlers (spec 16).
