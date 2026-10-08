# Feature: 02 — Architecture Foundation

**Spec:** `docs/specs/02-architecture-foundation/SPEC.md` + `ISSUE.md`

## Objective

Establish the hexagonal skeleton (Ports & Adapters): canonical `src/` folder tree, verifiable
dependency-boundary lint rules, explicit composition root (no DI framework), logger abstraction
with secret redaction, and the cross-cutting rules (mappers, hops, i18n/PWA readiness, code
quality) so every later spec only fills defined holes.

## Constraints

- Single Next.js project, App Router only (never `pages/`). Read `node_modules/next/dist/docs/`
  before Next-specific changes.
- TypeScript `strict` stays on.
- REQ-02 hard rule: `src/domain/` must never import Next.js, React, Supabase, Spoonacular,
  `fetch`, or UI components — enforced by lint, not goodwill.
- No DI framework. No prohibited tech (#75 list from spec 01 / REQ-09 of spec 02).
- Out of scope: concrete entities/use cases/repositories (own specs); docs/diagram (spec 17).
- Migration must not change behavior: `git mv` only + config path updates.

## Scope decisions (recorded rationale)

- **Composition root location:** `src/lib/composition/` — the REQ-07 folder list has no
  dedicated composition folder; `src/lib` is the cross-cutting slot, keeping layers intact.
- **Composition root wiring (REQ-08):** the chain
  `SupabaseRecipeRepository + SpoonacularRecipeProvider → RecipeRecommendationService → FindRecipesFromPantry`
  is a *documented example* (spec says "cadena de ejemplo"); concrete use cases are out of
  scope here. The root is implemented and tested wiring the concrete Logger adapter through
  ports; the recipe chain is documented in JSDoc for specs 03–05 to fill. Acceptance item
  "adapters → use cases" is reported honestly as deferred-to-03/05, not faked with dead code
  (REQ-14 forbids files without value).
- **Boundary enforcement tool:** ESLint core only — `no-restricted-imports` (patterns/group)
  + `no-restricted-globals` (`fetch`) + `no-restricted-syntax` for REQ-11 hops. No new
  dependency (`eslint-plugin-boundaries` unnecessary → KISS).
- **Strict TDD:** not enabled — no explicit activation evidence in session/project config.
  Ordinary functional checks + targeted tests.
- **Mapper rule (REQ-10):** code-level mappers belong to specs 05/06; here the rule is
  enforced structurally (domain boundary lint) and stated as an architecture rule.
- **Branch:** `feat/02-architecture-foundation` off `feat/01-project-scaffold` (spec 01 is
  unmerged and 02 depends on it).

## Route declaration

- Exploration: inline (delegation attempted → runtime blocked; user-authorized inline
  fallback). Evidence: 5 files read (tsconfig, eslint.config, components.json, vitest.config,
  tree/greps) — mapping trigger would normally fire one `explore` worker.
- Implementation: writer trigger would fire (2+ non-trivial files); delegation unavailable
  this session (all subagent types return the free-tier runtime error), proceeding inline
  under the user's standing authorization to continue when delegation fails.

## Forecast & delivery

- Forecast authored changed lines (additions + deletions, generated excluded): ~250–400
  (mostly moves; new code: lint rules, logger, composition root, 2 test files, README edits).
- Delivery strategy: `ask-on-risk` (default). Will ask before commit if running count >400.
- Work-unit commits: one per coherent unit below (see Progress).

## Checklist

- [ ] T1. Feature doc (this file) + engram mirror — **inline**
- [ ] T2. Migrate to `src/`: `git mv app src/app`, `git mv lib src/lib`; create
      `src/components`, `src/domain`, `src/application`, `src/infrastructure`, `src/types`,
      `supabase/`, `tests/` (with `.gitkeep` where empty); update `tsconfig.json` paths
      (`@/*` → `./src/*`) and `components.json` css path — **inline**
- [ ] T3. Boundary lint rules (REQ-02, REQ-11): domain purity (framework/Supabase/fetch
      banned from `src/domain/**`), no `fetch("/api/...")` from app tree — **inline**
- [ ] T4. Logger: port in application, console adapter in infrastructure, levels
      `debug/info/warn/error`, secret redaction; unit tests — **inline**
- [ ] T5. Composition root (`src/lib/composition/`) + test instantiating it with fakes
      (ISSUE test case 3) + JSDoc recipe-chain example — **inline**
- [ ] T6. README: repository map + architecture rules (hops, mappers, i18n readiness,
      PWA/Capacitor) — **inline**
- [ ] T7. Verification: `install/lint/typecheck/format/build/test/test:e2e` all exit 0 +
      boundary audit proof (deliberate violation → lint fails → revert) — **inline**
- [ ] T8. Work-unit commit(s) with conventional messages; update this doc with evidence

## Acceptance criteria

- [ ] Folder tree matches REQ-07; each file in exactly one layer.
- [ ] Static verification proves no domain file imports framework/infra packages (REQ-02).
- [ ] Composition root wires adapters explicitly, no DI framework (REQ-08).
- [ ] Single logger implementation; grep shows no secret logging (REQ-09).
- [ ] No Server Component calls own `/api/*` routes (REQ-11).
- [ ] No DI framework, no prohibited technology (REQ-14 / #75).

## Progress / evidence

(to be filled per task)

## Next step

Spec 03+ (domain entities/use cases) once 02 is committed and verified.
