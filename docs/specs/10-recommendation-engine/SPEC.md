# SPEC: 10 — Recommendation Engine & Matching Algorithm

**Source:** PROMTP.md #2 (Central principle), #14 (Recommendation service), #15 (Matching algorithm), #16 (Pantry staples), #17 (Cuisine filter), #31 (Recommendation strategy), #33 (Deduplication), #71 (Result shape), #86 (Source priority), #88 (Recommendations endpoint input).

## Purpose

Build `RecipeRecommendationService`: the ingredient→recommendation pipeline with a simple, explainable match score, internal-first sourcing, Spoonacular supplementation, deduplication, and relevance-based ordering.

## Scope

### In scope
- Recommendation service (input/output contract).
- Matching algorithm (MVP-simple, extensible).
- Pantry staples scoring rule and optional cuisine filter.
- End-to-end strategy: normalize → internal → (if insufficient) external → map → match → merge → dedup → sort.
- Result DTO shape.

### Out of scope
- HTTP endpoint (spec 11), UI rendering of scores (spec 14), normalization primitives (spec 06), provider internals (spec 09).

## Requirements

| ID | Requirement |
|----|-------------|
| REQ-01 | Service `RecipeRecommendationService`. Input: `availableIngredients`, `mealType?`, `cuisine?`, `maxPreparationTime?`, `difficulty?`, `dietaryPreferences?`. Output per result: `recipe`, `matchScore`, `availableIngredients`, `missingIngredients`, `optionalMissingIngredients`. |
| REQ-02 | Base score = `available required ingredients / total required ingredients` (e.g. 4/5 = 80%). `matchScore` is a 0–1 value (`RecipeMatchScore`). |
| REQ-03 | Algorithm must be simple and explainable for the MVP, while remaining extensible toward: optional ingredients, pantry staples, quantities, substitutions, ingredient relevance, preferences, dietary restrictions. **No over-complex algorithm now.** |
| REQ-04 | Pantry staples (`isPantryStaple = true`: salt, pepper, oil, sugar, water) must **not** strongly penalize the score; classification comes from the catalog, never assumed uniformly for all users. |
| REQ-05 | Cuisine filter is optional with default `ALL`; when set (e.g. `Peruvian`), results are filtered/prioritized for that cuisine. `FindRecipesFromPantry` never treats cuisine as mandatory. |
| REQ-06 | Strategy flow: user ingredients → normalization → internal catalog → matching → internal results → if insufficient → Spoonacular → mapping → matching → merge → dedup → ordering → results. Internal recipes are prioritized **when they are good matches**; Spoonacular is complementary and never a single point of failure. |
| REQ-07 | Deduplication between internal and external versions of the same recipe using simple heuristics for the MVP: normalized name, source, external id, slug. Architecture must allow improving the algorithm later. No complex algorithm now. |
| REQ-08 | Ordering priority: (1) match quality, (2) ingredient availability, (3) user preferences, (4) recipe quality/reliability, (5) source. Do **not** simply sort `Internal > Spoonacular` when an external recipe matches much better — balance `relevance + matchScore + user filters + source quality`. |
| REQ-09 | Result shape exposed to consumers (API/UI) per PROMTP #71, including example `matchScore: 0.92` with `availableIngredients`/`missingIngredients`/`optionalMissingIngredients` arrays. |
| REQ-10 | Recommendation input from clients: `{ ingredientIds, mealType, cuisineId }` (see spec 11 for transport). |

## Dependencies

- `06-domain-layer`, `07-application-layer`, `09-spoonacular-adapter` (fallback path), `08-infrastructure-supabase` (internal recipes).

## Acceptance criteria

- [ ] Score of 4/5 required ingredients = 0.8 in unit tests (REQ-02).
- [ ] Missing staple (salt) does not drop the score like a missing main ingredient (REQ-04).
- [ ] No cuisine specified → results span multiple cuisines (Casos 2/3 of PROMTP #83).
- [ ] With Spoonacular failing → internal results still returned (Caso 5).
- [ ] Same recipe from internal + Spoonacular appears once after dedup.
- [ ] Ordering test: a better-matching external recipe can rank above a weaker internal one.

## Verification

Domain/application unit tests for scoring, staples, cuisine optionality, dedup and ordering (spec 16).
