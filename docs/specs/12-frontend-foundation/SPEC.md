# SPEC: 12 — Frontend Foundation (Landing, UX Standards, State & Component Primitives)

**Source:** PROMTP.md #38 (Frontend), #39 (Landing page), #45 (Components), #46 (UX), #47 (State management), #48 (Server Components), #51 (i18n readiness).

## Purpose

Set the frontend experience and rules: a modern mobile-first food-discovery feel, the landing page, shared UI primitives, UX standards (states, accessibility), and the state/data-fetching strategy.

## Scope

### In scope
- Design/UX principles for the whole app.
- Landing page at `/`.
- Shared components (all reusable pieces of PROMTP #45).
- State management and Server/Client Component rules.

### Out of scope
- Dashboard/pantry pages (spec 13), recipes/detail/favorites pages (spec 14), auth pages shell (spec 05).

## Requirements

| ID | Requirement |
|----|-------------|
| REQ-01 | Modern, clean, mobile-first experience that feels like a **food-discovery app**, not an admin panel. |
| REQ-02 | Landing `/`: communicates "¿Qué puedo cocinar con lo que tengo?", CTA **Comenzar**, visual examples, brief explanation of: add ingredients → choose what to cook → discover recipes → save favorites. |
| REQ-03 | Reusable components: `IngredientSearch`, `IngredientSelector`, `PantryList`, `PantryItem`, `MealTypeSelector`, `CuisineSelector`, `RecipeCard`, `RecipeGrid`, `RecipeMatchScore`, `MissingIngredients`, `RecipeIngredients`, `RecipeInstructions`, `FavoriteButton`, `EmptyState`, `LoadingState`, `ErrorState`. Use shadcn/ui where appropriate; Lucide React icons. |
| REQ-04 | UX: mobile-first, responsive, accessible, fast, clear, intuitive. Loading states, empty states, error states, skeletons where sensible, user feedback, visible validations. Semantic HTML + accessibility best practices. |
| REQ-05 | State management: **no Redux**. Prefer Server Components, Server Actions where appropriate, React state, URL search params, React Hook Form. Avoid unnecessary global state. |
| REQ-06 | Client Components only when interaction is needed: local state, browser events, interactive forms, browser APIs. Everything else stays a Server Component. |
| REQ-07 | i18n readiness: UI copy structured so languages can be added later; no hardcoded domain decisions. (Full i18n not required in MVP.) |
| REQ-08 | Forms use React Hook Form + Zod with visible validation feedback. |

## Dependencies

- `01-project-scaffold`, `02-architecture-foundation`, `05-supabase-auth` (session context for protected shell).

## Acceptance criteria

- [ ] Landing renders at `/` with the exact message, CTA and 4 explained steps.
- [ ] All 15 components of REQ-03 exist and are used or exported from the components tree.
- [ ] Lighthouse/mobile viewport: no horizontal overflow; tap targets usable.
- [ ] Every data view has loading/empty/error states.
- [ ] Audit: no unnecessary `'use client'` boundaries; no Redux/global state library installed.

## Verification

Component tests (RTL) for primitives + visual/manual pass on the landing; accessibility spot check (semantic HTML, labels).
