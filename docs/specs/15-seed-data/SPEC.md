# SPEC: 15 — Seed Data (Multicultural Catalog)

**Source:** PROMTP.md #52 (Seed data), #53 (Copyright/Content), #68 (Migrations — seed placement).

## Purpose

Seed the catalog with original, multicultural content: cuisines, ingredients, and internal recipes across at least six cuisines so the app demonstrates its multi-cuisine principle from day one.

## Scope

### In scope
- Seed migrations/SQL for `cuisines`, `ingredients`, `recipes`, `recipe_ingredients`.
- Content rules (originality/copyright).

### Out of scope
- Schema definition (spec 03), user data, Spoonacular content.

## Requirements

| ID | Requirement |
|----|-------------|
| REQ-01 | Seed must be **multicultural**. Do NOT seed only Colombian recipes. Include a small but useful set from different cuisines. |
| REQ-02 | Minimum cuisine coverage with example recipes: **Colombia** (huevos pericos, arepa con queso, calentado, changua, sudado de pollo, arroz con pollo, fríjoles, ajiaco, patacones, arepa con huevo), **Perú** (causa limeña, lomo saltado, ají de gallina, arroz chaufa), **Argentina** (milanesa, empanadas, choripán, carne al horno), **México** (tacos de carne, quesadillas, huevos rancheros, chilaquiles), **España** (tortilla española, patatas bravas, gazpacho), **Italia** (pasta al pomodoro, pasta aglio e olio, frittata, risotto). The final MVP dataset may be smaller — examples, not a quota. |
| REQ-03 | Seed ingredients must include pantry staples flagged `is_pantry_staple = true` (salt, pepper, oil, sugar, water) plus the ingredients the seed recipes require. |
| REQ-04 | Every seed recipe links to its `cuisines` row and its `recipe_ingredients` rows with quantities/units/optional flags; recipes must exercise the matching algorithm (some fully matchable with seeded ingredients, some missing items). |
| REQ-05 | Content must be original, specifically created, based on general culinary knowledge, or legally distributable. Do **not** copy complete recipes from copyrighted sites or mass-copy recipe-site content. Respect external provider licenses for external content. |
| REQ-06 | Seeds live as versioned migrations (e.g. `003_seed_cuisines.sql`, `004_seed_recipes.sql`), consistent with the migrations policy of spec 03 — not ad-hoc manual inserts. |

## Dependencies

- `03-database-schema` (tables must exist).

## Acceptance criteria

- [ ] Applying migrations seeds ≥6 cuisines and a working recipe set spanning them.
- [ ] `is_pantry_staple` flags present for salt/pepper/oil/sugar/water.
- [ ] A search with `papa, carne, huevo` returns seed matches from at least two different countries.
- [ ] All seeded content passes the copyright rule (REQ-05) — origin documented.
- [ ] Seeds are repeatable migrations, not manual cloud-only inserts.

## Verification

Fresh-database migration + the multi-cuisine search check above (covered by E2E in spec 16).
