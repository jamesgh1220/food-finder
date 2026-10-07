# SPEC: 04 — Row Level Security & Backend Security

**Source:** PROMTP.md #20 (Row Level Security), #56 (Security), #57 (Env variables — enforcement), #67 (Security E2E — verification owned by `16-testing-strategy`).

## Purpose

Enforce data isolation and the MVP security baseline: RLS policies per table, server-side authorization, input validation, secret protection, safe error handling, and external timeouts.

## Scope

### In scope
- RLS policies for every user-owned and global catalog table.
- Security checklist enforcement across the app (auth, Zod, IDs, secrets, errors, rate limiting cross-ref, timeouts).

### Out of scope
- E2E security tests (owned by `16-testing-strategy`).
- Rate-limit implementation (owned by `11-api-layer`).
- Auth flows/clients (owned by `05-supabase-auth`).

## Requirements

| ID | Requirement |
|----|-------------|
| REQ-01 | `profiles`: user can read/modify **only their own** profile. |
| REQ-02 | `pantry_items`: user can select/insert/update/delete **only their own** rows — never another user's. |
| REQ-03 | `favorite_recipes`: user manages only their own favorites. |
| REQ-04 | `recipes`: public/internal recipes readable by authenticated users; no arbitrary user may modify the global catalog. |
| REQ-05 | `ingredients`: readable by authenticated users; no arbitrary writes. |
| REQ-06 | `cuisines`: readable; no arbitrary modifications from the frontend. |
| REQ-07 | Enable RLS on every table with policies matching REQ-01…REQ-06 (no table left unprotected). |
| REQ-08 | Supabase Auth + RLS + application-level authorization all in place; authorization must be backed by backend/RLS, **never only by the UI**. |
| REQ-09 | Zod validation of all inputs: query params, body, route params, IDs, filters, quantities, units. Never trust client input directly. |
| REQ-10 | Never send secrets to the client. `SUPABASE_SECRET_KEY` and `SPOONACULAR_API_KEY` stay server-side only (enforced by env naming from spec 01). |
| REQ-11 | Safe error handling: never expose stack traces, API keys, secrets, internal details, SQL, or sensitive information to clients. |
| REQ-12 | Timeouts on external calls (Spoonacular) so a hung provider cannot hang requests. |

## Dependencies

- `03-database-schema` (tables must exist before policies).
- `05-supabase-auth` (session/user identity used by policies) — can be developed in parallel, verified together.

## Acceptance criteria

- [ ] Every table in the schema has RLS enabled with at least one policy per REQ-01…REQ-06.
- [ ] Query as user A returns zero rows of user B for `pantry_items` and `favorite_recipes`.
- [ ] Unauthenticated requests to catalog tables are rejected per policy design.
- [ ] No API response body contains stack traces, SQL strings or secrets (spot check error paths).
- [ ] All external calls have finite timeouts.

## Verification

SQL/RLS checks per table + integration/security tests deferred to `16-testing-strategy` (cases S1–S5 there mirror REQ-01…REQ-06).
