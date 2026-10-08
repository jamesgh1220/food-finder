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

- [x] T1. Feature doc (this file) + engram mirror — **inline** (`d38bb9c`)
- [x] T2. Migrate to `src/`: `git mv app src/app`, `git mv lib src/lib`; create
      `src/components`, `src/domain`, `src/application`, `src/infrastructure`, `src/types`,
      `supabase/`, `tests/` (with `.gitkeep` where empty); update `tsconfig.json` paths
      (`@/*` → `./src/*`) and `components.json` css path — **inline** (`d500842`)
- [x] T3. Boundary lint rules (REQ-02, REQ-11): domain purity (framework/Supabase/fetch
      banned from `src/domain/**`), no `fetch("/api/...")` from app tree — **inline** (`2bcb731`)
- [x] T4. Logger: port in application, console adapter in infrastructure, levels
      `debug/info/warn/error`, secret redaction; unit tests — **inline** (`76b4a34`)
- [x] T5. Composition root (`src/lib/composition/`) + test instantiating it with fakes
      (ISSUE test case 3) + JSDoc recipe-chain example — **inline** (`76fcbad`)
- [x] T6. README: repository map + architecture rules (hops, mappers, i18n readiness,
      PWA/Capacitor) — **inline** (`07df0a8`)
- [x] T7. Verification: `install/lint/typecheck/format/build/test/test:e2e` all exit 0 +
      boundary audit proof (deliberate violation → lint fails → revert) — **inline**
- [x] T8. Work-unit commits with conventional messages; this doc updated with evidence

## Acceptance criteria

- [x] Folder tree matches REQ-07; each file in exactly one layer.
- [x] Static verification proves no domain file imports framework/infra packages (REQ-02).
- [x] Composition root wires adapters explicitly, no DI framework (REQ-08).
      NOTE: recipe-chain wiring (adapters → use cases) is documented in JSDoc and deferred to
      specs 03–05 — creating placeholder use cases would violate the spec's own out-of-scope
      and REQ-14 (no files without value). Logger adapter IS wired concretely.
- [x] Single logger implementation; grep shows no secret logging (REQ-09).
- [x] No Server Component calls own `/api/*` routes (REQ-11).
- [x] No DI framework, no prohibited technology (REQ-14 / #75) — zero new dependencies.

## Progress / evidence

- T2: `git mv` renames only (4 + 1 files); stale `.next/` had to be deleted (its generated
  validators referenced old `app/` paths); `LayoutProps` needs `.next` regenerated by build.
  build ✔ typecheck ✔ lint ✔ after migration.
- T3: boundary audit with real probes —
  - domain probe (`next/link`, `@supabase/supabase-js`, `fetch("/api/...")`) → 3 errors ✔
  - app probe (`fetch("/api/x")` + template literal) → 2 REQ-11 errors ✔
  - negative control (`fetch("https://example.com/v1")`) → not flagged ✔
  - probes removed → `pnpm lint` clean ✔
  - Gotcha: ESLint selector dialect supports only `=`, `!=`, and regex `/.../` — NOT `^=`/`*=`.
    Proven selectors: `CallExpression[callee.name="fetch"] > Literal[value=/^\/api/]` and the
    TemplateLiteral variant (debugging via `--rule` from the shell was poisoned by JSON
    escaping; debug via a temp config file instead).
- T4: 5 unit tests — levels exposed, console routing, min-level filtering, top-level secret
  redaction (apiKey/password/token never reach output), nested redaction. Gotcha: a context
  key named `keys` matches the `key` pattern and redacts the whole value — fail-closed,
  correct by design.
- T5: 2 unit tests — injected port is wired as-is (ISSUE test case 3); default falls back to
  the single console adapter.
- T6: README repository map now lists all REQ-07 paths; architecture rules section written.
- T7 full verification: `format:check` ✔ · `lint` ✔ · `typecheck` ✔ · `test` 7/7 ✔ ·
  `build` ✔ · `test:e2e` 1 passed ✔. Grep audit: no direct `console.*`/`logger.*` calls in
  `src/` outside the adapter — single logging path confirmed.
- Actual authored changed lines vs `ee7dc9b`: **396** (386+10), 21 files — within the ~400
  budget, no chain split required. Strategy `ask-on-risk` → no ask triggered.
- Commits: `d38bb9c` docs · `d500842` refactor(src) · `2bcb731` feat(lint) · `76b4a34`
  feat(logging) · `76fcbad` feat(composition) · `07df0a8` docs(readme).

## Next step

Spec 03 (`03-database-schema`).
