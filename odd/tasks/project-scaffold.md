# Feature: 01 — Project Scaffold

**Spec:** `docs/specs/01-project-scaffold/SPEC.md` + `ISSUE.md`

## Objective

Turn the bare `create-next-app` baseline into the verified scaffold the rest of the specs build on: current compatible versions, full script set, lint/format/strict tooling, UI/form/validation deps, `.env.example` contract, and the explicit "no over-engineering" limit.

## Constraints

- Single Next.js project (App Router only — never create `pages/`); backend lives inside it.
- Read current Next.js docs in `node_modules/next/dist/docs/` before writing Next-specific code.
- TypeScript `strict` stays on. No legacy configs copied from old tutorials.
- Forbidden for the MVP (REQ-09): microservices, Kafka, Kubernetes, Redis without need, GraphQL, Elasticsearch, vector DB, event sourcing, full CQRS, payments, subscriptions, push notifications, complex AI agents, distributed architecture.
- Never `NEXT_PUBLIC_SUPABASE_SECRET_KEY` or `NEXT_PUBLIC_SPOONACULAR_API_KEY`.
- Out of scope: hexagonal/folder architecture, Supabase/DB/auth setup, feature code.

## Inspection report (REQ-01, done before changes)

Baseline state on `main` at `57e13fc`:

- Next.js 16.4.0, React 19.3.0, React DOM 19.3.0, TypeScript ^5 (`strict: true` ✅), pnpm 10.15.1.
- Tailwind CSS v4 + `@tailwindcss/turbopack`, ESLint 9 + `eslint-config-next`.
- `app/` exists (App Router ✅), no `pages/` ✅, no `.env.example` ❌.
- Scripts present: `dev`, `build`, `start`, `lint`. Missing: `typecheck`, `test`, `test:watch`, `test:e2e` ❌.
- Missing deps: Prettier, shadcn/ui, React Hook Form, Zod, Vitest, Playwright, Supabase packages (Supabase itself is out of scope for this spec; only env contract).
- No prior work destroyed; docs/specs and odd/ artifacts left intact.

## Checklist

- [x] T1. Repo inspection + baseline report (REQ-01) — **inline**
- [x] T2. Verify current stable, mutually compatible versions before install: Next.js, React, TypeScript, Supabase packages, Tailwind, shadcn/ui, Zod, React Hook Form, Vitest, Playwright + confirm current Supabase env var naming (REQ-04, REQ-07) — **delegated research**
- [x] T3. Missing scripts (`typecheck`, `test`, `test:watch`, `test:e2e`) + Vitest + Playwright configs (REQ-06) — **writer (cancelled mid-task) + inline completion**
- [x] T4. Prettier + ESLint + strict verification (REQ-05) — **writer (cancelled mid-task) + inline completion**
- [x] T5. shadcn/ui + React Hook Form + Zod installed and working (in-scope tooling) — **inline**
- [x] T6. `.env.example` with the exact 6 vars (REQ-07/REQ-08) — **inline**
- [x] T7. Document chosen versions + "no over-engineering" limit (REQ-09 + acceptance) — **inline**
- [x] T8. Verification: `pnpm install`, `pnpm dev`, `pnpm build`, `pnpm lint`, `pnpm typecheck` all exit 0 — **inline (parent)**

## Route declaration

- T1: inline (1-file decide/verify, no delegation trigger)
- T2: delegated (broad research / context compression) — succeeded, full version report
- T3–T7: writer delegation attempted (writer trigger: 2+ non-trivial files); runtime **cancelled the task after it had completed Phase A**. Continued inline to avoid further delay (user explicitly authorized continuing without delegation).
- T8: inline parent verification (delegated verification gate skipped — no writer to gate)

## Forecast & delivery

- Forecast authored changed lines (additions + deletions, generated files excluded): ~250–400 (configs + README + .env.example).
- **Actual** authored changed lines vs main (excl. lockfile): 377 additions + 42 deletions, 14 files — within the ~400 budget, no split required.
- Delivery strategy: `ask-on-risk` (default). No PR yet; work units commit to this feature branch.
- Work-unit commits:
  - C1: tooling — scripts, Prettier, ESLint, Vitest, Playwright configs → `cbbd226`
  - C2: UI deps — shadcn/ui, React Hook Form, Zod → `6484f24`
  - C3: env contract + docs — `.env.example`, versions record, no-over-engineering limit → (this commit)

## Progress / evidence

- T2 research (2026-10-07): npm registry + official docs + local `node_modules/next/dist/docs/`. Key outcomes: keep installed Next 16.4.0 / React 19.3.0 / TS 5.9.x (typescript-eslint peer `<6.1.0` blocks TS 7); `eslint-config-next` 16 removed its `/prettier` entrypoint → `eslint-config-prettier/flat` spread after Next configs; Vitest 5 requires explicit `vite` peer; `vitest.config.mts` convention per Next 16 guide; Supabase publishable/secret naming confirmed current.
- C1 (`cbbd226`): lint ✔, typecheck ✔, format:check ✔, test ✔, test:e2e ✔ (harness passes without browser download). Vite 8 resolves tsconfig paths natively → dropped `vite-tsconfig-paths` plugin.
- C2 (`6484f24`): shadcn init flags used: `init -y -b base -p nova -s` (non-interactive; `-p base-nova` is invalid — presets are nova/vega/...). **Fix applied:** shadcn rewrote `--font-sans: var(--font-sans)` (self-referential, would drop Geist) → restored `var(--font-geist-sans)`/`var(--font-geist-mono)`; verified generated CSS resolves `font-family: var(--font-geist-sans)`. build ✔ lint ✔ typecheck ✔ format:check ✔ test ✔.
- C3 (this): `.env.example` has exactly the 6 REQ-07 vars; `.gitignore` now un-ignores `.env.example`; README rewritten (scripts, versions, env contract, REQ-09 constraints).
- T8 full verification: `pnpm install --frozen-lockfile` ✔ · `pnpm lint` ✔ · `pnpm typecheck` ✔ · `pnpm format:check` ✔ · `pnpm build` ✔ · `pnpm test` ✔ (0, passWithNoTests) · `pnpm test:e2e` ✔ (1 passed) · dev smoke `HTTP 200` ✔.

## Acceptance criteria

- [x] `pnpm install`, `pnpm dev`, `pnpm build`, `pnpm lint`, `pnpm typecheck` work.
- [x] All 8 scripts exist and exit 0 (tests may be empty until 16-testing-strategy).
- [x] `.env.example` matches REQ-07 exactly; no secret `NEXT_PUBLIC_*` anywhere.
- [x] No `pages/` directory.
- [x] Chosen versions documented and coherent with REQ-04.

## Next step

Spec 02 (`02-architecture-foundation`).
