# ODD — Spec 10: Recipe Recommendation Engine

## Objective

Implement the application-level recommendation pipeline that scores recipes against a user's pantry, optionally filters by meal type/cuisine and other supported preferences, combines internal recipes with Gemini fallback results, and returns one explainable, deduplicated ranking.

Specification: `docs/specs/10-recommendation-engine/SPEC.md` and `ISSUE.md`.

## Why

The recommendation port and `FindRecipesFromPantry` exist, but the use case currently forwards only ingredients, meal type, and cuisine. There is no concrete recommendation service or matching test suite. Recipe candidates also need their recipe-ingredient relations to produce availability/missing-ingredient explanations; the current repository contract does not load those relations, and the Gemini mapping currently drops ingredient relations.

## Authorized scope

- **In scope:** implement the `RecipeRecommendationService` contract and its application/domain matching behavior; pass supported request filters through; load recipe-ingredient and catalog pantry-staple metadata; add a narrow migration for persisted recipe-ingredient optionality; use a simple, explainable required-ingredient score; preserve optional-missing details; treat cuisine as optional; query internal candidates first and use Gemini when no internal candidate scores at least 0.8; merge, deduplicate, and rank by match quality before source tie-break; add focused unit tests and update spec evidence.
- **Out of scope:** HTTP endpoint/transport (spec 11), UI score rendering (spec 14), normalization primitives (spec 06), changes to Gemini's generation/client internals beyond the narrow mapping needed to retain recipe ingredients, complex recommendation/scoring algorithms, substitutions, quantity-aware scoring, and schema expansion unrelated to this pipeline.
- **Preserve:** existing user changes; use `pnpm` only; code, identifiers, comments, and commits in English. `.codex/config.toml` was committed as `a2b9349` and the feature branch was fast-forwarded into local `main`; push remains out of scope. RDD is clone-local OFF, so no review was started.

## Constraints and decisions

- **Route:** delegated direct implementation. The task spans multiple non-trivial application/domain/infrastructure files; reading that prepares implementation belongs with the delegated writer. Source edits began only after the task document's Engram mirror was persisted.
- **TDD:** strict TDD is disabled; no explicit activation was found in project configuration, consistent with `odd/tasks/09-gemini-adapter.md`. Test runner: `pnpm test` (Vitest).
- **Delivery:** `ask-on-risk`; the user selected `stacked-to-main` if this feature is split into PRs. The current work unit is one commit; 400 authored changed lines per PR is a planning budget, not a reason to omit tests or compress code.
- **Feature branch:** `feat/10-recommendation-engine` (created before source edits).
- **Design:** keep matching deterministic and explainable. Pantry staples come from ingredient catalog metadata, not a universal hard-coded user assumption. Internal source preference must not outrank a materially better match.

## Estimated size

Approximately 985 authored changed lines across implementation, tests, and documentation; generated type output is excluded. The 400-line budget is advisory, not a cap; no cosmetic slicing or test omission was used. The user selected `stacked-to-main` for any future PR chain.

## Tasks

- [x] **T1 — Establish implementation boundary:** created `feat/10-recommendation-engine` and traced the recommendation port/use case, recipe and ingredient entities, repository contracts, Gemini provider output, and composition wiring. The implementation needs recipe/ingredient joins; the generated Supabase schema currently lacks the domain's optional flag.
- [x] **T2 — Supply candidates with matching data:** add `recipe_ingredients.optional` through migration `003_recipe_ingredient_optionality.sql` with a `false` default; add a Supabase recommendation catalog joining recipes, relations, and ingredient metadata; preserve Gemini ingredient names and optionality in recommendation candidates.
- [x] **T3 — Implement explainable matching:** score required non-staple availability in range 0–1; keep missing staples visible without reducing the score; report optional misses separately; return zero for recipes with no ingredient relations.
- [x] **T4 — Orchestrate recommendation sources and filters:** forward meal type, cuisine, preparation time, difficulty, and the existing preference shape; cuisine remains optional; apply catalog filters; call Gemini when no internal result scores at least 0.8; keep internal results if Gemini errors.
- [x] **T5 — Merge, deduplicate, and rank:** combine candidates, deduplicate by normalized recipe name, and rank by match score, available ingredient count, then internal source as a tie-break. Preferences remain future-facing as defined in spec 07.
- [x] **T6 — Verify behavior and document evidence:** cover scoring, staples, optionality, cuisine, filters, Gemini fallback/failure, deduplication, and better external matches; run the project checks and record evidence in this document and `docs/specs/10-recommendation-engine/ISSUE.md`.

## Acceptance criteria

- [x] A recipe with 4 of 5 required ingredients scores exactly `0.8`.
- [x] Missing a catalog-marked staple does not penalize the score as strongly as missing a main required ingredient; staple classification is read from catalog data.
- [x] Optional missing ingredients are reported separately and do not reduce the required-ingredient score.
- [x] Omitting cuisine allows matching recipes from multiple cuisines; selecting cuisine filters or prioritizes accordingly without making it mandatory at the use-case boundary.
- [x] Recommendation filters (`mealType`, cuisine, preparation time, and difficulty) reach the service/provider path. Dietary preferences remain future-facing because current recipe models do not represent them.
- [x] Gemini failure leaves usable internal recommendations available.
- [x] Internal and external copies of the same recipe collapse to one result.
- [x] A materially better external match can rank above a weaker internal match.
- [x] Result shape includes the recipe, 0–1 `matchScore`, and available/missing/optional-missing ingredient arrays.
- [x] `pnpm lint`, `pnpm typecheck`, and `pnpm test` pass.

## Progress / evidence

- [x] Mapping handoff confirmed: `src/application/ports/recipe-recommendation.ts` exists; `FindRecipesFromPantry` forwards only ingredients, meal type, and cuisine; Recipe has source/filter fields; Ingredient has pantry-staple metadata; RecipeIngredient marks optionality; repository lacks relationship loading; Gemini currently drops ingredient relations; no concrete recommendation service or tests exist.
- [x] Task document and Engram mirror persisted before source edits.
- [x] Added `optional BOOLEAN NOT NULL DEFAULT FALSE` in migration `supabase/migrations/003_recipe_ingredient_optionality.sql`; the checked-in `src/types/database.types.ts` now includes the column. Applied through Supabase MCP to project `vhjxhqaowxonmtgusskt`; verified migration `20261009202334` and the column's `false` default.
- [x] Generated-type CLI refresh was unavailable: `supabase gen types --local` could not inspect schema because no local Supabase container is running. The checked-in type was synchronized with the migration; `--linked` was deliberately not used.
- [x] `pnpm lint` — PASS.
- [x] `pnpm typecheck` — PASS.
- [x] `pnpm test` — PASS, 25 files / 176 tests.
- [x] Work-unit commit `1ff3915` — `feat(recommendations): support optional recipe ingredients`. Authored diff was 958 insertions and 39 deletions; `stacked-to-main` is selected if a PR chain is needed. The 400-line figure is advisory and no artificial code slicing was done.

## Work-unit evidence

- **Purpose:** implement end-to-end pantry matching, resilient internal/Gemini recommendations, and the recipe-ingredient optionality migration.
- **Focused test:** `pnpm exec vitest run tests/unit/application/create-recipe-recommendation-service.test.ts tests/unit/application/recipes-use-cases.test.ts tests/unit/infrastructure/gemini/providers/gemini-recipe-provider.test.ts tests/unit/infrastructure/supabase-repositories.test.ts` — PASS, 4 files / 56 tests.
- **Runtime harness:** N/A — spec 10 exposes no runtime endpoint or UI; transport is spec 11.
- **Rollback boundary:** revert the spec 10 service/catalog/provider wiring, associated tests/docs, and `003_recipe_ingredient_optionality.sql`; no unrelated feature behavior is removed.

## Next step

Feature commits `1ff3915`, `521ef31`, and `a2b9349` are now included on local `main` by fast-forward from `feat/10-recommendation-engine`. No push was performed.
