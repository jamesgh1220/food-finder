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

- [ ] T1. Repo inspection + baseline report (REQ-01) — **inline**
- [x] T2. Verify current stable, mutually compatible versions before install: Next.js, React, TypeScript, Supabase packages, Tailwind, shadcn/ui, Zod, React Hook Form, Vitest, Playwright + confirm current Supabase env var naming (REQ-04, REQ-07) — **delegated research**
- [x] T3. Missing scripts (`typecheck`, `test`, `test:watch`, `test:e2e`) + Vitest + Playwright configs (REQ-06) — **delegated writer**
- [x] T4. Prettier + ESLint + strict verification (REQ-05) — **delegated writer**
- [ ] T5. shadcn/ui + React Hook Form + Zod installed and working (in-scope tooling) — **delegated writer**
- [ ] T6. `.env.example` with the exact 6 vars (REQ-07/REQ-08) — **delegated writer**
- [ ] T7. Document chosen versions + "no over-engineering" limit (REQ-09 + acceptance) — **delegated writer**
- [ ] T8. Verification: `pnpm install`, `pnpm dev`, `pnpm build`, `pnpm lint`, `pnpm typecheck` all exit 0 — **delegated writer + parent spot check**

## Route declaration

- T1: inline (1-file decide/verify, no delegation trigger)
- T2: delegated (broad research / context compression)
- T3–T7: delegated (writer trigger: 2+ non-trivial files)
- T8: writer self-verification + parent spot check (delegated verification gate)

## Forecast & delivery

- Forecast authored changed lines (additions + deletions, generated files excluded): ~250–400 (configs + README + .env.example).
- Delivery strategy: `ask-on-risk` (default). No PR yet; work units commit to this feature branch. Split only if the running count exceeds ~400 authored lines.
- Work-unit commits planned:
  - C1: tooling — scripts, Prettier, ESLint, Vitest, Playwright configs
  - C2: UI deps — shadcn/ui, React Hook Form, Zod
  - C3: env contract + docs — `.env.example`, versions record, no-over-engineering limit

## Progress / evidence

- (pending)

## Acceptance criteria

- [ ] `pnpm install`, `pnpm dev`, `pnpm build`, `pnpm lint`, `pnpm typecheck` work.
- [ ] All 8 scripts exist and exit 0 (tests may be empty until 16-testing-strategy).
- [ ] `.env.example` matches REQ-07 exactly; no secret `NEXT_PUBLIC_*` anywhere.
- [ ] No `pages/` directory.
- [ ] Chosen versions documented and coherent with REQ-04.

## Next step

Launch T2 version research (delegated).
