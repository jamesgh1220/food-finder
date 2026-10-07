# SPEC: 05 — Supabase Auth (Clients, Sessions, Protected Routes)

**Source:** PROMTP.md #13 (Auth use cases), #21 (Supabase clients), #22 (Supabase Auth), #24 (SDK vs Auth distinction), #57 (env vars).

## Purpose

Implement authentication end-to-end: correctly separated Supabase clients, the four auth use cases, session handling, protected routes, and the login/register pages.

## Scope

### In scope
- Browser / server / admin Supabase clients via `@supabase/ssr`.
- Auth use cases: `RegisterUser`, `LoginUser`, `LogoutUser`, `GetCurrentUser`.
- Protected route behavior (`/dashboard` → redirect `/login`).
- Auth pages `/login`, `/register` (UI shell; full design language belongs to frontend specs).

### Out of scope
- RLS policies (spec 04), profiles table details (spec 03), full frontend design (specs 12–14).

## Requirements

| ID | Requirement |
|----|-------------|
| REQ-01 | Use `@supabase/supabase-js` + `@supabase/ssr` with current recommended practices (verify current docs — do not copy outdated tutorials). |
| REQ-02 | Clearly separate: **browser client**, **server client**, and **admin/service client** only when strictly necessary. |
| REQ-03 | `SUPABASE_SECRET_KEY` (or current recommended name) exists **only on the server**. Never `NEXT_PUBLIC_SUPABASE_SECRET_KEY`. Never expose service-role keys to the browser. |
| REQ-04 | Use cases: `RegisterUser`, `LoginUser`, `LogoutUser`, `GetCurrentUser` (application-layer implementations calling the auth port). |
| REQ-05 | Pages: `/login` and `/register`. Protected area: `/dashboard`. Unauthenticated access to protected routes redirects to `/login`. |
| REQ-06 | Use the current recommended mechanism to maintain/refresh Supabase sessions in Next.js (verify docs: middleware/proxy/session handling). |
| REQ-07 | Distinguish concepts in code and docs: Supabase **MCP** (dev tooling) ≠ Supabase **SDK** (runtime) ≠ Supabase **Auth** (end users). |

## Dependencies

- `01-project-scaffold`, `03-database-schema` (`profiles`), `02-architecture-foundation` (ports/DI).

## Acceptance criteria

- [ ] Register → authenticated and redirected to `/dashboard`.
- [ ] Login with valid credentials → `/dashboard`; logout → session cleared, protected routes inaccessible.
- [ ] Visiting `/dashboard` unauthenticated redirects to `/login`.
- [ ] `GetCurrentUser` returns the session user in server contexts.
- [ ] Grep confirms no secret key in any `NEXT_PUBLIC_*` variable or client bundle.
- [ ] Only one clearly documented place creates the admin client, guarded by server-only env access.

## Verification

Unit tests for auth use cases with a mocked auth port + manual/E2E flow (register, login, logout, redirect) covered in `16-testing-strategy`.
