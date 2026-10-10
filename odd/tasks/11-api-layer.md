# ODD — Spec 11: Capa API

## Objective

Exponer los casos de uso mediante Route Handlers de Next.js 16 con el conjunto exacto de 13 endpoints, validación Zod, un envelope uniforme de éxito/error, mapeo correcto de errores a HTTP y rate limiting en el endpoint de recomendaciones.

Especificación: `docs/specs/11-api-layer/SPEC.md` y `ISSUE.md`.

## Why

La API es la superficie de integración externa de Food Finder: 13 rutas con validación de todo input, envelope `success/data` o `success/error.code`, mapeo correcto de errores a status HTTP y rate limiting en el endpoint que dispara llamadas al proveedor externo (Gemini). Los casos de uso ya existen en la capa application; falta la capa de transporte HTTP.

## Authorized scope

- **In scope:** Implementar los 13 endpoints según REQ-01. Validación Zod para query/body/params. Envelope de éxito/error uniforme. Mapeo error→HTTP completo (8 códigos). Rate limiting sencillo en `POST /api/recipes/recommendations` sin Redis (in-memory). Autorización en endpoints de datos de usuario (pantry, favorites). Infra helpers reutilizables para handlers. Tests unitarios para helpers y handlers con casos de uso mockeados. Wiring de SearchIngredients.
- **Out of scope:** Lógica de casos de uso, internals del motor de recomendación, consumo frontend. Cambios a RLS (spec 04).
- **Preserve:** Código, identificadores, comentarios, commits en inglés. UI copy no aplica; respuestas API pueden tener mensajes en español consistentes con errores de dominio existentes. pnpm only.

## Constraints and decisions

- **Route:** Delegated direct implementation was attempted but unavailable in this runtime (free-tier). Degradation path: implement inline single-threaded, keeping parent context thin by working in small units. The choice of inline is intentional and documented.
- **TDD:** Strict TDD disabled per spec 10 doc. Use pragmatic test-first for pure helpers (envelope, error mapper, validation, rate limit). Handler tests alongside implementation.
- **Tests:** Vitest, `tests/unit/api/*.test.ts` per spec verification.
- **Next.js 16:** Route Handlers en `src/app/api/**/route.ts`. `context.params` es Promise → `const {id} = await ctx.params`. `cacheComponents: true` PROHÍBE `export const dynamic` (el build falla); la dinamización es automática al usar `connection()`/`cookies()`. Las 13 rutas quedan `ƒ (Dynamic)` sin config de segmento.
- **Rate limiting:** In-memory sliding window per IP (fallback to "unknown"). Aplicar solo a `POST /api/recipes/recommendations`. No Redis. Clave: IP → `x-forwarded-for` o request IP.
- **Envelope:** `{"success": true, "data": ...}` / `{"success": false, "error": {"code", "message", "details"}}`. Nunca exponer stack traces, secrets, SQL.
- **Error mapping:** Mapear errores de dominio a códigos HTTP según spec 11 REQ-05. Rate limit excedido → código `RATE_LIMITED` (API-level) con HTTP 429.
- **Auth:** Endpoints pantry/favorites requieren sesión autenticada. `requireAuthenticatedUser` ya resuelve user desde AuthPort (sesión servidor). RLS actúa como retaguardia.
- **Server composition:** Crear `src/lib/composition/server-application.ts` para obtener servicios con cliente Supabase server + gemini provider (degradado sin key). Importar desde handlers vía wrapper.

## Estimated size

~900-1200 authored changed lines (helpers + 13 routes + tests + wiring). 400-line advisory, no artificial splitting to fit.

## Tasks

- [x] T1: Wiring SearchIngredients en composition (ApplicationDependencies + ApplicationServices). Import quebrado eliminado en application.ts. `tests/unit/application/composition.test.ts` actualizado (`searchIngredients` + `ingredients`). Añadido test del caso de uso `tests/unit/application/search-ingredients.test.ts`.
- [x] T2: `src/lib/composition/server-application.ts` (server-auth + repos + gemini provider degradado + recommendation service + application services).
- [x] T3: Infra API helpers: `src/lib/api/{envelope,errors,validation,rate-limit,schemas,serializers}.ts`.
- [x] T4: `src/lib/api/http.ts` (error boundary con `unstable_rethrow`) + handlers puros `src/lib/api/handlers/{recipes,recommendations,ingredients,cuisines,pantry,favorites}.ts`.
- [x] T5: 13 Route Handlers en `src/app/api/**/route.ts` (params Promise, `new URL(request.url).searchParams`). Rate limit en recommendations POST. Sin `export const dynamic` (incompatible con `cacheComponents`).
- [x] T6: Tests API `tests/unit/api/{response,validation,rate-limit,handlers}.test.ts`. Cubre envelope, 400/401/404/502/429 y no-leak de stack.
- [x] T7: `tsc --noEmit` PASS, `eslint .` PASS, `vitest run` PASS (30 archivos, 202 tests), `next build` PASS (exit 0). Evidencia en `docs/specs/11-api-layer/ISSUE.md`.

## Acceptance criteria

- [x] Los 13 endpoints de REQ-01 existen y responden con envelope correcto (unit + build).
- [x] Body/query/param inválido → 400 con `VALIDATION_ERROR` y `details`.
- [x] Request no autenticada a pantry/favorites → 401 (mapeo a nivel handler con caso de uso mockeado).
- [x] Recurso inexistente → 404 (mapeo verificado); 409 disponible en el mapeo.
- [x] Más de N requests/min a recommendations → 429.
- [x] Error externo mapeado a 502 sin stack trace/secrets/SQL.
- [x] `POST /api/recipes/recommendations` retorna forma de la spec 10 dentro del envelope.
- [x] Respuestas de error sin stack traces/secretos/SQL (test de no-leak).
- [x] Tests pasan; lint + typecheck pasan; build pasa. **Pendiente:** tests de integración con Supabase real (spec 16).

## Progress / evidence

- [x] Exploración mapeo completo (use cases, entities, auth, Next 16, conventions) — inline (delegation unavailable).
- [x] Documento feature creado antes de primer write (este archivo).
- [x] Tareas T1–T7 completadas.
- [x] Verificación: `tsc --noEmit` PASS; `eslint .` PASS; `vitest run` PASS (30 archivos / 202 tests); `next build` PASS (13 rutas `ƒ (Dynamic)`).
- [ ] Pendiente: tests de integración que golpeen handlers reales con Supabase (spec 16).
