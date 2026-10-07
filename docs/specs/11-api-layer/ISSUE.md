# ISSUE: 11 — Capa API

## Título

Exponer los casos de uso como Route Handlers con validación Zod, envelope de respuesta uniforme, mapeo de errores HTTP y rate limiting

## Descripción

La API es la superficie de integración externa de Food Finder: 13 rutas (recetas, recommendations, ingredients, cuisines, pantry, favorites) con validación de todo input, envelope `success/data` o `success/error.code`, mapeo correcto de errores a status HTTP y rate limiting en el endpoint que dispara llamadas a Spoonacular.

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
7. Error simulado de Spoonacular → 502 mapeado o fallback según spec 10, sin stack trace en la respuesta.
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
