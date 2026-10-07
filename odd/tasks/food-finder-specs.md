# Feature: Food Finder — Spec & Issue Generation

## Objective
Analyze `docs/PROMTP.md` (master prompt, 3339 lines, 100 sections) WITHOUT executing it, then generate a decomposition of specs under `docs/specs/<spec-name>/`, each containing `SPEC.md` and `ISSUE.md`.

## Constraints
- Read-only analysis of PROMTP.md — no code, no app scaffold, no SDD artifacts.
- Each spec folder: `docs/specs/<spec-name>/SPEC.md` + `ISSUE.md`.
- ISSUE.md structure (mandatory order): Titulo, Descripcion, Objetivo, Alcance, Casos de prueba (si aplica), Consideraciones tecnicas, Criterios de aceptacion, Resultado esperado.
- Whole artifact set in Spanish (user explicitly requested full translation override): SPEC.md and ISSUE.md bodies in Spanish; IDs, tables, commands, code, and English UI strings stay as-is.
- Docs-only change → structural readback verification.

## Checklist
- [x] T1. Map PROMTP.md — done inline (Task delegation failed: runtime free-tier restriction; task cancelled by user).
- [x] T2. Spec decomposition decided: 17 specs in dependency order (numbered folders).
- [x] T3. Specs 01–04 (scaffold, architecture, database, RLS)
- [x] T4. Specs 05–10 (auth, domain, application, infra-supabase, spoonacular, recommendation)
- [x] T5. Specs 11–17 (api, frontend foundation, dashboard/pantry, recipes/favorites, seed, testing, docs/release)
- [x] T6. Structural readback: glob confirmed 34/34 files (17 folders × SPEC+ISSUE).
- [x] T7. Full Spanish translation of all 34 files (user-requested override).
- [x] T8. Post-translation readback: 34/34 files, 17×8 Spanish ISSUE headers, zero English headings, zero CJK characters.

## Route declaration
- T1: inline (delegation attempted, runtime blocked it)
- T2: inline (orchestrator decision)
- T3–T5: inline writes (delegation unavailable this session)
- T6: inline structural readback
- T7–T8: inline writes + readback (delegation unavailable this session)

## Decomposition (final)
17 specs in dependency order: 01-project-scaffold, 02-architecture-foundation, 03-database-schema, 04-security-rls, 05-supabase-auth, 06-domain-layer, 07-application-layer, 08-infrastructure-supabase, 09-spoonacular-adapter, 10-recommendation-engine, 11-api-layer, 12-frontend-foundation, 13-frontend-dashboard-pantry, 14-frontend-recipes-favorites, 15-seed-data, 16-testing-strategy, 17-documentation-release.

## Key findings in PROMTP.md (contradictions flagged in delivery)
- Route-group vs URL conflict: folder `(dashboard)/page.tsx` maps to `/`, and `(dashboard)/pantry` to `/pantry`, but routes required are `/dashboard` and `/dashboard/pantry`; also `app/page.tsx` and `(dashboard)/page.tsx` would collide at `/`. Specs 13/14 make specified URLs authoritative.
- #18 lists `recipe_tags`/`dietary_tags` not designed in #19 (deferred, noted in spec 03).
- #34 lists 13 endpoints (counted 13, not 12) — recorded exactly in spec 11.

## Progress
- 2026-10-07: COMPLETE — 34 files written, translated to Spanish, and verified (headers, no English headings, no CJK).
- 2026-10-07: npm → pnpm migration in specs 01/03/16/17 + README + PROMTP.md #91/DoD (user preference; repo already pnpm-native). Project sweep clean.

## Delivery forecast
Docs-only, no code lines; no PR budget concern.
