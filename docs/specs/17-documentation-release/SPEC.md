# SPEC: 17 — Documentation, Observability & Release Readiness

**Source:** PROMTP.md #78 (README), #79 (Documentation), #80 (Architecture diagram), #89 (Observability), #90 (Deployment readiness), #91 (Local development), #96 (Definition of Done), #97 (Final agent output), #81 (Development process).

## Purpose

Ship the documentation set, the architecture diagram, the observability abstraction, deployment readiness, and run the final Definition of Done verification.

## Scope

### In scope
- `README.md` (complete) + Mermaid architecture diagram.
- `docs/architecture.md`, `docs/database.md`, `docs/api.md`, `docs/setup.md`, `docs/decisions/`.
- Observability abstraction (logs/metrics/tracing ready, no platform in MVP).
- Deployment readiness for a Next.js-compatible platform (e.g. Vercel).
- Final Definition of Done checklist verification.

### Out of scope
- Feature implementation (specs 01–16).

## Requirements

| ID | Requirement |
|----|-------------|
| REQ-01 | README explains: what Food Finder is, stack, architecture, structure, installation, env vars, Supabase, Supabase Auth, Supabase MCP, Spoonacular, migrations, seed, type generation, development, tests, build, deployment. Includes a Mermaid architecture diagram. |
| REQ-02 | Create `docs/architecture.md`, `docs/database.md`, `docs/api.md`, `docs/setup.md` and `docs/decisions/`. |
| REQ-03 | Decision records must document especially: why hexagonal architecture, why Supabase, why Spoonacular, why `Cuisine` is an entity and not an enum, matching strategy, fallback strategy, security strategy. |
| REQ-04 | Architecture diagram (Mermaid, per PROMTP #80, improved if the final architecture requires it): UI → Route Handlers/Server Actions → Use Cases → Domain Services + Ports → Supabase/Spoonacular adapters → PostgreSQL/Auth. |
| REQ-05 | Observability: keep an abstraction that can later incorporate logs, metrics, tracing, errors — **no complex external platform in the MVP** (builds on the logger of spec 02). |
| REQ-06 | Deployment readiness: prepared for a Next.js-compatible platform (Vercel or equivalent); do not assume a VPS; Supabase = managed backend; Spoonacular = external service. Architecture: `User → Next.js → Supabase → PostgreSQL`, plus `Next.js → Spoonacular` when needed. |
| REQ-07 | Local development documented: `npm install`, `npm run dev`, plus commands for Supabase local, migrations, seed, type generation, tests (#91). |
| REQ-08 | Final **Definition of Done** — verify ALL: `npm install/dev/build/lint/typecheck` work; unit/integration/E2E tests pass; Supabase integrated; Auth works; RLS works; migrations work; seed works; pantry/recipes/recommendations/favorites/cuisine filtering/multi-cuisine work; Spoonacular works; Spoonacular failure handling works; no secrets exposed; API validated; errors handled; UI responsive; docs updated; `.env.example` exists; database types current; MCP documented/configured; hexagonal architecture respected; domain independent of infrastructure. |
| REQ-09 | Final delivery report per PROMTP #97 (25-point summary: architecture, folder structure, deps, env vars, migrations, tables, RLS, entities, VOs, use cases, ports, adapters, Spoonacular, algorithm, endpoints, screens, tests, MCP, dev/test/typegen/Supabase/Spoonacular commands, key decisions, future improvements). |

## Dependencies

All previous specs (01–16).

## Acceptance criteria

- [ ] README and the four `docs/*.md` files exist and match the implemented system (no aspirational content).
- [ ] Mermaid diagram renders and reflects the real architecture.
- [ ] `docs/decisions/` contains the seven required decision records.
- [ ] Every item of REQ-08 checked and green.
- [ ] REQ-09 report produced at delivery.

## Verification

Walk the DoD checklist item by item with observed command results; render README/mermaid preview.
