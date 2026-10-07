# SPEC: 02 — Architecture Foundation

**Source:** PROMTP.md #7 (Architecture), #8 (Layers), #9 (Folder structure), #49 (Avoid unnecessary hops), #51 (i18n readiness), #59 (Mappers), #60 (DI), #61 (Logging), #74 (Capacitor/PWA readiness), #76 (Code quality).

## Purpose

Establish the hexagonal (Ports & Adapters) skeleton, folder structure, dependency-injection, logging, mapper and code-quality rules that keep the domain independent of Next.js, React, Supabase and Spoonacular.

## Scope

### In scope
- Layer definitions and the dependency rule.
- Canonical folder structure for `src/`, `supabase/`, `tests/`, `docs/`.
- Simple explicit DI (composition root; no DI framework).
- Logging abstraction (`debug`/`info`/`warn`/`error`) with secret redaction.
- Mandatory mapper rule (DB rows and external DTOs never reach the domain).
- Call-path rule: no unnecessary API hops from Server Components.
- i18n readiness and future PWA/Capacitor compatibility constraints.
- Code-quality principles (SOLID, DRY, KISS, strict typing).

### Out of scope
- Concrete entities/use cases/repositories (their own specs).
- Mermaid diagram and docs files (see `17-documentation-release`).

## Requirements

| ID | Requirement |
|----|-------------|
| REQ-01 | Layers: `Presentation → Application → Domain → Ports → Infrastructure/Adapters`. |
| REQ-02 | **Domain must not import** Next.js, React, Supabase, Spoonacular, `fetch`, or UI components. |
| REQ-03 | Presentation: UI, pages, components, forms, Route Handlers, input validation, HTTP serialization — no complex business logic. |
| REQ-04 | Application: use cases, coordination, DTOs, ports, use-case-level authorization, repository/service orchestration. |
| REQ-05 | Domain: entities, value objects, business rules, domain services, domain errors, matching/recommendation logic. |
| REQ-06 | Infrastructure: Supabase, PostgreSQL, Spoonacular, HTTP, persistence, technical auth, mappers, external clients. |
| REQ-07 | Implement the folder structure of PROMTP #9 (`src/app`, `src/components`, `src/domain`, `src/application`, `src/infrastructure`, `src/lib`, `src/types`, `supabase/`, `tests/`, `docs/`), adapting only for current Next.js conventions while preserving layer separation. |
| REQ-08 | Explicit dependency injection via a composition root (or equivalent). No DI framework. Example chain: `SupabaseRecipeRepository` + `SpoonacularRecipeProvider` → `RecipeRecommendationService` → `FindRecipesFromPantry`. |
| REQ-09 | Logging abstraction with levels `debug/info/warn/error`. Never log API keys, passwords, tokens, secrets or sensitive data. |
| REQ-10 | Mappers are mandatory: `SupabaseRow → Mapper → Domain Entity` and `SpoonacularDTO → Mapper → Recipe`. Raw rows/DTOs never cross into domain/application. |
| REQ-11 | A Server Component must call use cases directly (`Server Component → Use Case → Repository → Supabase`), never `fetch("/api/...")` to its own Route Handlers. Route Handlers exist for external clients/APIs and genuinely needed cases. |
| REQ-12 | i18n readiness: do not hardcode domain decisions that would block Spanish/English/Portuguese/French later. Full i18n is **not** required in the MVP. |
| REQ-13 | Do not install Capacitor; keep architecture PWA/Capacitor-compatible (avoid depending exclusively on server-side APIs for features that must later run on mobile). |
| REQ-14 | Code quality: SOLID, DRY, KISS, composition, small functions, descriptive names, strict typing, explicit errors. Hexagonal architecture must not become an excuse for hundreds of valueless files. |

## Dependencies

- `01-project-scaffold` (project, tooling, strict TS).

## Acceptance criteria

- [ ] Folder tree matches REQ-07; every source file lives in exactly one layer.
- [ ] A static check (lint rule, import audit, or review) confirms no domain file imports infrastructure/framework packages (REQ-02).
- [ ] One composition root wires adapters into use cases explicitly (REQ-08).
- [ ] A single logger implementation exists; grep shows no secret logging (REQ-09).
- [ ] No Server Component calls the project's own `/api/*` routes (REQ-11).
- [ ] No DI framework or banned technology (#75) was added.

## Verification

Import-boundary lint/audit + code review against REQ-02, REQ-08, REQ-10, REQ-11.
