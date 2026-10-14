# SPEC: 11 — Capa API (Route Handlers, validación, envelope de respuesta, errores, rate limiting)

**Fuente:** PROMTP.md #34 (Endpoints), #35 (Validación), #36 (Respuesta de API), #37 (Tipos de error → HTTP), #55 (Rate limiting), #71 (Respuesta de resultados), #88 (Principio de diseño de API).

## Propósito

Exponer los casos de uso mediante Route Handlers de Next.js con el conjunto exacto de endpoints, validación Zod, un envelope uniforme de éxito/error, mapeo correcto de errores a HTTP y rate limiting en el endpoint de recomendaciones.

## Alcance

### Dentro del alcance
- Los 13 endpoints, validación Zod, envelope de respuesta, mapeo error→HTTP, rate limiting.
- Autorización en cada endpoint de datos de usuario.

### Fuera del alcance
- Lógica de casos de uso (spec 07), internals de recomendación (spec 10), consumo desde el frontend (specs 12–14).

## Requisitos

| ID | Requisito |
|----|-----------|
| REQ-01 | Endpoints (mínimo): `GET /api/recipes`, `GET /api/recipes/[id]`, `POST /api/recipes/recommendations`, `GET /api/ingredients`, `GET /api/ingredients/search`, `GET /api/cuisines`, `GET /api/pantry`, `POST /api/pantry`, `PATCH /api/pantry/[id]`, `DELETE /api/pantry/[id]`, `GET /api/favorites`, `POST /api/favorites`, `DELETE /api/favorites/[recipeId]`. |
| REQ-02 | Las APIs representan casos de uso reales — sin endpoints CRUD innecesarios inventados por seguir CRUD (#88). |
| REQ-03 | Validación Zod para query params, request body, route params, IDs, filtros, cantidades, unidades. Nunca confiar directamente en el input del cliente. |
| REQ-04 | Envelope de éxito: `{"success": true, "data": {}}`. Envelope de error: `{"success": false, "error": {"code", "message", "details"}}` (p. ej. `VALIDATION_ERROR`). |
| REQ-05 | Mapeo error → HTTP: 400 Validation, 401 Unauthorized, 403 Forbidden, 404 Not Found, 409 Conflict, 429 Rate Limit, 500 Internal, 502 External Service. |
| REQ-06 | Nunca exponer stack traces, API keys, secretos, detalles internos, SQL ni información sensible en las respuestas. |
| REQ-07 | `POST /api/recipes/recommendations` acepta `{ ingredientIds: [], mealType: "LUNCH", cuisineId: null }` y retorna resultados con la forma de la spec 10 (`recipe`, `matchScore`, `availableIngredients`, `missingIngredients`, `optionalMissingIngredients`) dentro del envelope de éxito. |
| REQ-08 | Rate limiting en los endpoints que pueden disparar llamadas al proveedor externo (Gemini) — especialmente `POST /api/recipes/recommendations` — para que un usuario no pueda generar miles de requests externos. Estrategia sencilla compatible con el entorno; **sin Redis** solo para esto. |
| REQ-09 | Autenticación/autorización aplicada en todos los endpoints de datos de usuario (pantry, favorites): no autenticado → 401; recurso de otro usuario → 403/404 según política; RLS sigue siendo la retaguardia. |
| REQ-10 | Los Route Handlers son la superficie de integración para clientes externos/APIs; los Server Components pueden invocar casos de uso directamente en su lugar (spec 02, REQ-11). |

## Dependencias

- `07-application-layer`, `10-recommendation-engine`, `06-domain-layer` (errores), `04-security-rls`.

## Criterios de aceptación

- [x] Cada endpoint de REQ-01 responde con el envelope y los códigos de estado correctos. *(verificado a nivel handler con casos de uso mockeados; `tests/unit/api/handlers.test.ts` + `response.test.ts`)*
- [x] Body/query/param inválido → 400 con `VALIDATION_ERROR` y `details`.
- [ ] Request no autenticada a pantry/favorites → 401; intento de escritura cruzada de usuario → bloqueado (RLS/autorización). *(**parcial**: el 401 está verificado a nivel handler; el bloqueo de escritura cruzada depende de RLS y queda pendiente de un entorno con base de datos)*
- [x] Requests rápidas y repetidas a recommendations superando el umbral → 429.
- [x] Grep de las rutas de error no muestra stack traces/secretos/SQL. *(`toErrorResponse` responde 500 con `Error interno del servidor.` genérico y loguea el detalle en servidor)*

## Verificación

Tests unitarios con casos de uso mockeados por ruta + tests de integración que golpean handlers reales (spec 16).

**Evidencia observada (2026-10-10):** `tsc --noEmit` PASS · `eslint .` PASS (0 warnings) · `vitest run` PASS — 30 archivos / 202 tests · `next build` PASS (13 rutas `ƒ (Dynamic)`). Detalle completo en el registro del `ISSUE.md`.

## Implementación (resultado) — 2026-10-10 · registrado 2026-10-13

**Estado:** completada con dos verificaciones diferidas (integración real y 403 contra RLS). Commit de work-unit: `3578213` `feat(api): add route handlers, zod validation, envelope and rate limiting`.

- **Rutas:** Route Handlers delgados en `src/app/api/**/route.ts` que componen servicios y delegan en funciones puras en `src/lib/api/handlers/`. `next build` clasifica las 13 rutas como `ƒ (Dynamic)`.
- **Envelope:** `src/lib/api/envelope.ts` — éxito `{"success":true,"data":...}`, error `{"success":false,"error":{code,message,details}}`.
- **Errores:** `src/lib/api/errors.ts` (`toErrorResponse`) mapea a los 8 códigos de REQ-05. Un error desconocido se loguea en servidor y responde 500 con mensaje genérico, sin stack ni detalle interno (REQ-06).
- **Validación:** Zod para query/body/params en `src/lib/api/schemas.ts` + `parseOrThrow` (`src/lib/api/validation.ts`), que lanza `ValidationError` con `details.issues`.
- **Rate limiting:** ventana deslizante in-memory (10 req/60 s por cliente) en `src/lib/api/rate-limit.ts`; clave `x-forwarded-for` → `x-real-ip` → `"unknown"`. Sin Redis (REQ-08).
- **Autorización:** los endpoints de datos de usuario dependen de casos de uso que resuelven la sesión vía `requireAuthenticatedUser`; sin sesión → `UnauthorizedError` → 401, con RLS como retaguardia (REQ-09).
- **Wiring:** caso de uso `searchIngredients` conectado en `src/lib/composition/application.ts`; composition root de servidor `src/lib/composition/server-application.ts` (Supabase server + repositorios + provider Gemini degradado sin API key + servicio de recomendación).
- **Nota Next.js 16:** `cacheComponents: true` deshabilita `export const dynamic` (removido en todas las rutas); los handlers usan `new URL(request.url).searchParams` y `await params`.
- **Pendiente honesto:** sin tests de integración que golpeen handlers reales contra Supabase (spec 16); la verificación del 403 vía RLS queda para un entorno con base de datos.
