# SPEC: 08 — Infrastructure: Supabase Repositories & Mappers

**Source:** PROMTP.md #8 (Infrastructure), #12 (ports to implement), #58 (database types), #59 (Mappers), #69 (Indexes — query usage).

## Purpose

Implement the Supabase adapters: one repository per domain port, row↔entity mappers, and the technical auth adapter — the only place where SQL/Supabase knowledge is allowed to exist.

## Scope

### In scope
- `Supabase*Repository` implementations for all six ports.
- Row → domain mappers (and entity → row where needed) using generated `database.types.ts`.
- Auth adapter implementing the auth port.
- Infrastructure config (client wiring per spec 05).

### Out of scope
- Schema/migrations (spec 03), RLS (spec 04), Spoonacular (spec 09), composition root (spec 02).

## Requirements

| ID | Requirement |
|----|-------------|
| REQ-01 | Implement `RecipeRepository`, `IngredientRepository`, `CuisineRepository`, `PantryRepository`, `FavoriteRepository`, `UserRepository` as Supabase adapters under `src/infrastructure/supabase/`. |
| REQ-02 | Directory layout: `src/infrastructure/supabase/{client, repositories, mappers, auth}`. |
| REQ-03 | **Never** pass Supabase rows directly to domain/application: `SupabaseRow → RecipeMapper → Recipe` (same for every entity). Mappers are the architectural boundary. |
| REQ-04 | Use generated `src/types/database.types.ts` for all row types; no hand-written row types that can drift from the schema. |
| REQ-05 | Repositories translate domain queries into efficient SQL (indexes from spec 09 usage): filters on `slug`, `cuisine_id`, `meal_type`, `source`, joins through `recipe_ingredients`, user scoping on `pantry_items.user_id` / `favorite_recipes.user_id`. |
| REQ-06 | Avoid N+1 queries when loading recipes with ingredients (batch/join). |
| REQ-07 | Repository errors are wrapped as `RepositoryError` (domain error), never leaked as raw Supabase/Postgres errors. |
| REQ-08 | Server client only: repositories use the server-side Supabase client; no service-role key in browser paths. |

## Dependencies

- `03-database-schema`, `04-security-rls`, `05-supabase-auth`, `06-domain-layer`, `02-architecture-foundation`.

## Acceptance criteria

- [ ] Every port has exactly one Supabase implementation injected via the composition root.
- [ ] Grep shows zero direct row objects crossing out of `src/infrastructure/`.
- [ ] Integration tests (spec 16) persist and retrieve pantry/favorites/recipes through repositories against a real database.
- [ ] No N+1: recipe listing issues a bounded number of queries regardless of result size.

## Verification

Integration test suite against Supabase (spec 16) + code review for REQ-03/REQ-07.
