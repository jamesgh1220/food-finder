# Food Finder

Find recipes from what you already have at home. Single Next.js (App Router) project — the backend lives inside it as Route Handlers/Server Actions, no separate service.

## Quick path

1. `pnpm install`
2. `cp .env.example .env.local` and fill in real values
3. `pnpm dev` → open http://localhost:3000
4. Verify: `pnpm lint && pnpm typecheck && pnpm build` (all must exit 0)

## Scripts

| Script              | Command              | Purpose                                              |
| ------------------- | -------------------- | ---------------------------------------------------- |
| `pnpm dev`          | `next dev`           | Dev server with Turbopack                            |
| `pnpm build`        | `next build`         | Production build                                     |
| `pnpm start`        | `next start`         | Serve the production build                           |
| `pnpm lint`         | `eslint .`           | ESLint (Next + typescript + prettier-disarmed rules) |
| `pnpm typecheck`    | `tsc --noEmit`       | TypeScript `strict` check                            |
| `pnpm format`       | `prettier --write .` | Format source files                                  |
| `pnpm format:check` | `prettier --check .` | Fail if formatting drifts                            |
| `pnpm test`         | `vitest run`         | Unit tests (empty until spec 16)                     |
| `pnpm test:watch`   | `vitest`             | Unit tests in watch mode                             |
| `pnpm test:e2e`     | `playwright test`    | E2E tests (harness only until spec 16)               |

E2E specs use the `page` fixture and need browsers once: `pnpm exec playwright install chromium`.

## Stack (versions verified 2026-10-07)

Verified against npm registry, official docs, and `node_modules/next/dist/docs/` before install (spec 01, REQ-04).

| Package                                   | Version          | Notes                                                                  |
| ----------------------------------------- | ---------------- | ---------------------------------------------------------------------- |
| Next.js                                   | 16.4.0           | App Router only — `pages/` must never exist                            |
| React / React DOM                         | 19.3.0           | Server Components are the default                                      |
| TypeScript                                | 5.9.x (strict)   | Deliberately **not** TS 7: `typescript-eslint` peer range is `<6.1.0`  |
| Tailwind CSS                              | 4.x              | With `@tailwindcss/turbopack` — no PostCSS config                      |
| shadcn/ui                                 | CLI 4.x          | Base preset, CSS variables theming                                     |
| ESLint / Prettier                         | 9.x / 3.x        | Flat config; `eslint-config-prettier/flat` runs **after** Next configs |
| Zod                                       | 4.x              | Runtime validation                                                     |
| React Hook Form                           | 7.x              | Forms, with `@hookform/resolvers` for Zod                              |
| Vitest                                    | 5.x              | `vitest.config.mts`, jsdom; config per Next 16 testing guide           |
| Playwright                                | 1.64.x           | `testDir: e2e/`                                                        |
| `@supabase/supabase-js` / `@supabase/ssr` | 2.117.3 / 0.12.7 | Versions verified; **install deferred to spec 05**                     |

## Environment

`.env.example` is the contract. Copy it to `.env.local`; never commit real values.

**Rule:** secrets never carry the `NEXT_PUBLIC_` prefix. Next.js inlines every `NEXT_PUBLIC_*` variable into the browser bundle at build time — `SUPABASE_SECRET_KEY` and `GEMINI_API_KEY` are server-only, always. Supabase naming follows the current publishable/secret scheme (legacy `anon`/`service_role` names are deprecated).

## Project constraints — no over-engineering (REQ-09)

The MVP does **not** use: microservices, Kafka, Kubernetes, Redis without a demonstrated need, GraphQL, Elasticsearch, vector databases, event sourcing, full CQRS, payments, subscriptions, push notifications, complex AI agents, or distributed architecture.

Anything added to this repo must justify itself against this list.

## Repository map

| Path                          | Contents                                              |
| ----------------------------- | ----------------------------------------------------- |
| `src/app/`                    | App Router routes, layouts, globals (Presentation)    |
| `src/components/`, `src/lib/` | UI components, shared helpers, composition root       |
| `src/application/`            | Use cases, DTOs, ports (Application)                  |
| `src/domain/`                 | Entities, value objects, business rules (pure Domain) |
| `src/infrastructure/`         | Supabase, Gemini, HTTP, logging adapters              |
| `src/types/`                  | Shared type declarations                              |
| `supabase/`                   | DB migrations / config                                |
| `tests/`                      | Unit tests (Vitest)                                   |
| `e2e/`                        | Playwright specs                                      |
| `docs/specs/`                 | Numbered spec + issue pairs (the build plan)          |
| `odd/tasks/`                  | Active feature documents and progress evidence        |

## Architecture rules (spec 02)

- **Layer dependency:** Presentation → Application → Domain → Ports → Infrastructure. Each file lives in exactly one layer.
- **Pure domain (REQ-02):** `src/domain/` never imports Next.js, React, Supabase, Gemini, `fetch`, or UI components. Enforced by lint — a violating import fails `pnpm lint`.
- **Mappers (REQ-10):** DB rows and external responses are converted by mappers before reaching the domain (`SupabaseRow → Mapper → Entity`, `Gemini JSON → Zod + Mapper → Recipe`). Raw rows/DTOs never cross the boundary.
- **No self-fetch hops (REQ-11):** Server Components call use cases directly, never `fetch("/api/...")` on this app's own routes. Enforced by lint.
- **DI (REQ-08):** one composition root at `src/lib/composition/`, plain functions, no DI framework.
- **Logging (REQ-09):** single logger (`src/infrastructure/logging/console-logger.ts`) with `debug/info/warn/error`; sensitive keys are redacted before writing.
- **i18n readiness (REQ-12):** no hardcoded user-facing strings inside domain/application logic (full i18n is not an MVP requirement).
- **PWA/Capacitor readiness (REQ-13):** Capacitor is not installed; avoid designs that depend exclusively on server-only APIs for features that must later run on mobile.
- **Quality (REQ-14):** SOLID, DRY, KISS, strict typing, explicit errors — hexagonal layers are not an excuse to create files without value.

## Next step

Implement `docs/specs/03-database-schema/SPEC.md`.
