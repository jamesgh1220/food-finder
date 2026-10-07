# SPEC: 03 — Database Schema & Migrations

**Source:** PROMTP.md #18 (Database), #19 (Database design), #23 (Supabase MCP), #24 (MCP vs SDK vs Auth), #25 (MCP workflow), #58 (TS types), #68 (Migrations), #69 (Indexes), #84 (Multi-cuisine data model), #85 (Country vs cuisine).

## Purpose

Define the complete PostgreSQL schema for Supabase — tables, columns, constraints, indexes, versioned migrations, generated TypeScript types — with `cuisines` as an extensible catalog (never a rigid enum).

## Scope

### In scope
- Tables, columns, constraints and indexes for the MVP.
- Versioned migrations under `supabase/migrations/`.
- Generated `src/types/database.types.ts`.
- Supabase MCP configuration and its migration workflow.
- Data-model rules: cuisine catalog vs enum; country ≠ cuisine.

### Out of scope
- RLS policies (see `04-security-rls`).
- Seed content (see `15-seed-data`).
- Repository implementations (see `08-infrastructure-supabase`).

## Requirements

| ID | Requirement |
|----|-------------|
| REQ-01 | Tables (minimum): `profiles`, `cuisines`, `ingredients`, `recipes`, `recipe_ingredients`, `pantry_items`, `favorite_recipes`. `recipe_tags` and `dietary_tags` may be deferred for the MVP but the design must leave room for them. |
| REQ-02 | `profiles` relates to `auth.users`. Never store passwords manually. |
| REQ-03 | `cuisines`: `id, name, slug, country, region, description, created_at, updated_at`; `slug` UNIQUE; appropriate indexes. |
| REQ-04 | `ingredients`: `id, name, normalized_name, category, is_pantry_staple, created_at, updated_at`; index on `normalized_name`; case-insensitive search (`Tomate` = `tomate` = `TOMATE`). |
| REQ-05 | `recipes`: `id, name, slug, description, cuisine_id, country, region, meal_type, instructions, preparation_time, cooking_time, servings, difficulty, image_url, source, source_url, created_at, updated_at`. |
| REQ-06 | `recipe_ingredients`: relations + constraints, indexes on `recipe_id` and `ingredient_id`. |
| REQ-07 | `pantry_items`: `user_id, ingredient_id, quantity, unit, created_at, updated_at` with a unique constraint preventing duplicate user+ingredient rows. |
| REQ-08 | `favorite_recipes`: `user_id, recipe_id, created_at` with `UNIQUE(user_id, recipe_id)`. |
| REQ-09 | Indexes at minimum: `ingredients.normalized_name`, `recipes.slug`, `recipes.cuisine_id`, `recipes.meal_type`, `recipes.source`, `recipe_ingredients.recipe_id`, `recipe_ingredients.ingredient_id`, `pantry_items.user_id`, `pantry_items.ingredient_id`, `favorite_recipes.user_id`. Add only justified extras. |
| REQ-10 | Schema lives in **versioned migrations** (`supabase/migrations/001_*.sql`, …), never only in `seed.sql`. |
| REQ-11 | `cuisines` is a catalog table, **not** a TS/SQL enum: adding a cuisine = `INSERT`, no code change; must scale from 10 to 100+ cuisines without structural change. |
| REQ-12 | Store `cuisine`, `country`, `region` separately; never force `country = cuisine` (e.g. Mediterranean spans multiple countries). |
| REQ-13 | Generate `src/types/database.types.ts` from the real schema; document the regeneration command; never hand-write types that contradict the DB. |
| REQ-14 | Configure the official Supabase MCP for development (verify current URL/config in official docs; no hardcoded credentials). Understand the three distinct concepts: **MCP** (dev tooling), **SDK** (runtime), **Auth** (end users). |
| REQ-15 | MCP workflow: inspect project → tables → relations → RLS → functions/triggers → existing migrations → plan → versioned migration → apply → verify → regenerate types → run tests. Any MCP change must be reflected in repo migrations; never leave changes only in Supabase Cloud; never assume the project is empty. |

## Dependencies

- `01-project-scaffold`.

## Acceptance criteria

- [ ] Migrations apply cleanly on a fresh Supabase instance and on an existing one (idempotent by version order).
- [ ] Every table in REQ-01 exists with the columns/constraints of REQ-03…REQ-08.
- [ ] All REQ-09 indexes exist.
- [ ] `database.types.ts` regenerated from the live schema, not hand-written.
- [ ] Inserting a new cuisine row works without any code change (REQ-11).
- [ ] Case-insensitive lookup on `normalized_name` returns `Tomate` for query `TOMATE`.

## Verification

```bash
# apply migrations to a clean database, then:
npm run typecheck   # types reflect generated database.types.ts
```
Plus SQL checks for constraints/indexes and a manual MCP-workflow audit.
