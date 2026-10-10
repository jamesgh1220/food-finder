# ISSUE: 11 — Capa API

## Título

Exponer los casos de uso como Route Handlers con validación Zod, envelope de respuesta uniforme, mapeo de errores HTTP y rate limiting

## Descripción

La API es la superficie de integración externa de Food Finder: 13 rutas (recetas, recommendations, ingredients, cuisines, pantry, favorites) con validación de todo input, envelope `success/data` o `success/error.code`, mapeo correcto de errores a status HTTP y rate limiting en el endpoint que dispara llamadas al proveedor externo (Gemini).

## Objetivo

Una API predecible, segura y documentada: cualquier cliente puede consumirla confiando en el contrato de respuesta, y un usuario no puede abusar del proveedor externo.

## Alcance

- 13 endpoints según PROMTP #34 (ver REQ-01 del SPEC).
- Validación Zod: query, body, params, IDs, filtros, cantidades, unidades.
- Envelopes de éxito/error (#36) y mapeo error→HTTP (#37).
- `POST /api/recipes/recommendations` con body `{ingredientIds, mealType, cuisineId}` (#88).
- Rate limiting simple en recomendaciones (#55), sin Redis.
- Autorización en endpoints de datos de usuario.

**Fuera de alcance:** lógica de casos de uso, internals del motor, consumo desde el frontend.

## Casos de prueba

1. Cada endpoint REQ-01 responde 200 con `{"success": true, "data": ...}` en happy path.
2. Body inválido en recommendations → 400 `VALIDATION_ERROR` con `details`.
3. ID no UUID o inexistente en `/api/recipes/[id]` → 400/404 según corresponda.
4. `GET /api/pantry` sin sesión → 401.
5. Escritura de pantry con sesión de otro usuario → bloqueada (403/404 + RLS).
6. Más de N requests/min a recommendations → 429.
7. Error simulado del proveedor externo (Gemini) → 502 mapeado o fallback según spec 10, sin stack trace en la respuesta.
8. Ninguna respuesta contiene SQL, secretos ni trazas.

## Consideraciones técnicas

- Rate limiting: estrategia sencilla compatible con el entorno serverless (#55); no introducir infraestructura nueva solo para esto.
- Las rutas existen para clientes externos/APIs; los Server Components no deben auto-llamarse vía `/api` (spec 02).
- Validar SIEMPRE en el servidor aunque la UI ya valide (defensa en profundidad, #56).
- Unificar la construcción de respuestas en helpers reutilizables (envelope + error mapper).

## Criterios de aceptación

- [ ] Los 13 endpoints implementados y probados con el envelope correcto.
- [ ] Mapeo completo de los 8 códigos HTTP del SPEC.
- [ ] Zod en todas las entradas; tests de validación en verde.
- [ ] Rate limiting activo y verificado en recommendations.
- [ ] Autorización verificada (401/403) en pantry y favorites.

## Resultado esperado

API REST completa, validada y resistente al abuso externo, lista para que el frontend consuma recommendations, pantry y favorites con un contrato de respuesta único y fiable.

## Evidencia de implementación (2026-10-10)

- Se implementaron los 13 endpoints de REQ-01 como Route Handlers de Next.js 16 en `src/app/api/**/route.ts` (recipes, recipes/[id], recipes/recommendations, ingredients, ingredients/search, cuisines, pantry, pantry/[id], favorites, favorites/[recipeId]). Los handlers son delgados: componen servicios y delegan en funciones puras en `src/lib/api/handlers/`.
- Envelope uniforme en `src/lib/api/envelope.ts`: éxito `{"success":true,"data":...}`, error `{"success":false,"error":{code,message,details}}`. El mapeo error→HTTP vive en `src/lib/api/errors.ts` (`toErrorResponse`): 400 VALIDATION_ERROR, 401 UNAUTHORIZED, 403 FORBIDDEN, 404 NOT_FOUND, 409 CONFLICT, 429 RATE_LIMITED, 502 EXTERNAL_SERVICE, 500 REPOSITORY/INTERNAL. Un error desconocido se loguea en servidor y responde 500 con mensaje genérico `Error interno del servidor.`, sin stack ni detalle interno.
- Validación Zod de query/body/params en `src/lib/api/schemas.ts` + helper `parseOrThrow` (`src/lib/api/validation.ts`) que lanza `ValidationError` con `details.issues`. Cubre UUIDs, mealType (LUNCH/DINNER/SNACK), cantidades positivas, unidades y filtros.
- Rate limiting en `POST /api/recipes/recommendations`: ventana deslizante in-memory (10 req / 60 s por cliente) en `src/lib/api/rate-limit.ts`; clave `x-forwarded-for` → `x-real-ip` → `"unknown"`. Sin Redis. Excedido → 429 `RATE_LIMITED`.
- Autorización: los endpoints de datos de usuario (pantry, favorites) dependen de casos de uso que resuelven la sesión vía `requireAuthenticatedUser`; sin sesión el dominio lanza `UnauthorizedError` → 401. RLS permanece como retaguardia. Se probó el mapeo 401/404/502 a nivel handler.
- `GET /api/recipes` soporta filtros `search`/`mealType`/`cuisineId`; `POST /api/recipes/recommendations` acepta `{ingredientIds, mealType, cuisineId}` (REQ-07) y devuelve la forma de la spec 10 (`recipe`, `matchScore`, `availableIngredients`, `missingIngredients`, `optionalMissingIngredients`) serializada dentro del envelope.
- Next.js 16: `cacheComponents: true` deshabilita `export const dynamic`; se removió en todas las rutas. Las 13 rutas quedan clasificadas como `ƒ (Dynamic)` en el build. Los Route Handlers usan `new URL(request.url).searchParams` y `context.params` como Promise (`await params`).
- Wiring: nuevo caso de uso `src/application/ingredients/search-ingredients.ts` conectado en `src/lib/composition/application.ts` (`ApplicationDependencies.ingredients` + `ApplicationServices.searchIngredients`); nuevo composition root de servidor `src/lib/composition/server-application.ts` que arma cliente Supabase server + repositorios + provider Gemini (degradado sin API key) + servicio de recomendación.
- Verificación observada: `tsc --noEmit` PASS; `eslint .` PASS (0 warnings); `vitest run` PASS (30 archivos, 202 tests); `next build` PASS (exit 0, 0 errores), 13 rutas `ƒ (Dynamic)`.
- Pendiente honesto: no se añadieron tests de integración que golpeen handlers reales con Supabase (spec 16); la cobertura actual es unitaria con casos de uso mockeados. La verificación de 401/403 contra RLS real queda pendiente de un entorno con base de datos.

