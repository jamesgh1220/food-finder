# SPEC: 01 — Project Scaffold

**Source:** PROMTP.md #5 (Stack), #6 (Database deps), #57 (Env vars), #75 (No overengineering), #77 (Lint/Format), #92 (Version verification), #93 (Next.js rule), #99 (First step), Milestone 1.

## Purpose

Bootstrap the Food Finder repository as a single Next.js + TypeScript project with the tooling, scripts, and environment-variable contract every later spec builds on.

## Scope

### In scope
- Repository inspection before any change (no destruction of existing work).
- Next.js App Router + React + TypeScript (strict) scaffold.
- Styling/UI tooling: Tailwind CSS, shadcn/ui, Lint React, React Hook Form, Zod.
- Lint/format/typecheck configuration and `package.json` scripts.
- `.env.example` with the full environment contract.
- Explicit "no overengineering" boundary for the whole project.

### Out of scope
- Hexagonal layering and folder structure (see `02-architecture-foundation`).
- Supabase setup, auth, or database (see `05-supabase-auth`, `03-database-schema`).
- Any application feature code.

## Requirements

| ID | Requirement |
|----|-------------|
| REQ-01 | Inspect the repo first: identify existing stack, deps, config, Supabase artifacts, migrations. Do not destroy existing work without clear reason. |
| REQ-02 | Single Next.js project; backend lives inside it (Route Handlers/Server Actions). No separate backend service. |
| REQ-03 | Use current App Router practices only. Do **not** create a `pages/` directory. Read current Next.js docs before coding. |
| REQ-04 | Verify current stable, mutually compatible versions **before installing**: Next.js, React, TypeScript, Supabase packages, Tailwind CSS, shadcn/ui, Zod, React Hook Form, Vitest, Playwright. No legacy configs copied from old tutorials. |
| REQ-05 | ESLint + Prettier + TypeScript `strict` configured. |
| REQ-06 | Scripts exist and work: `dev`, `build`, `start`, `lint`, `typecheck`, `test`, `test:watch`, `test:e2e` (Supabase scripts optional). |
| REQ-07 | Create `.env.example` with: `NEXT_PUBLIC_SUPABASE_URL`, `NEXT_PUBLIC_SUPABASE_PUBLISHABLE_KEY`, `SUPABASE_SECRET_KEY`, `SPOONACULAR_API_KEY`, `SPOONACULAR_BASE_URL`, `NEXT_PUBLIC_APP_URL`. Verify current Supabase variable naming before finalizing. |
| REQ-08 | Never define `NEXT_PUBLIC_SUPABASE_SECRET_KEY` or `NEXT_PUBLIC_SPOONACULAR_API_KEY`. |
| REQ-09 | Forbidden stack for the MVP: microservices, Kafka, Kubernetes, Redis without need, GraphQL, Elasticsearch, vector DB, event sourcing, full CQRS, payments, subscriptions, push notifications, complex AI agents, distributed architecture. |

## Dependencies

None. This is Milestone 1 and the first deliverable.

## Acceptance criteria

- [ ] `npm install`, `npm run dev`, `npm run build`, `npm run lint`, `npm run typecheck` all succeed.
- [ ] All REQ-06 scripts exist and exit 0 (tests may be empty until `16-testing-strategy`).
- [ ] `.env.example` matches REQ-07 exactly; no forbidden `NEXT_PUBLIC_*` secret vars anywhere.
- [ ] No `pages/` directory exists.
- [ ] Version choices recorded and consistent with REQ-04.

## Verification

```bash
npm run lint && npm run typecheck && npm run build
```
