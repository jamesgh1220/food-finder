# ISSUE-DEFERRED: 04 — Ítems de seguridad diferidos a specs responsables

> Registro de trabajo de la spec `04-security-rls` que **no se implementó aquí** porque su código consumidor aún no existe (decisión de alcance "A" del 2026-10-08: evitar scaffolding especulativo). Cada ítem se cierra en la spec responsable indicada; esta issue se marca resuelta cuando todos los ítems estén verificados en su spec.

## Contexto

La spec 04 define una checklist de seguridad transversal. Al implementarla, el repo solo contenía: esquema de BD (spec 03), logger con redacción (spec 02) y contrato de env (spec 01). **No existían** rutas `/api/*`, cliente Gemini ni flujos de auth, por lo que estos requisitos eran vacíos o imposibles de probar en este punto. El núcleo bloqueante (RLS, REQ-01…REQ-08) **sí quedó implementado y verificado** en `supabase/migrations/002_rls_policies.sql`.

## Ítems pendientes

| # | Ítem (requisito 04) | Spec responsable | Criterio de cierre |
|---|---------------------|------------------|--------------------|
| 1 | Validación Zod de todos los inputs backend: query params, body, route params, IDs, filtros, cantidades, unidades (REQ-09) | `11-api-layer` | Cada uno de los 13 endpoints valida con Zod antes de tocar casos de uso; tests en `16-testing-strategy` |
| 2 | Ninguna respuesta de error expone stack traces, SQL, secretos ni detalles internos (REQ-11) | `11-api-layer` (envelope de error) + `09-gemini-adapter` REQ-08 (errores externos) | Tests de respuesta de error sin strings sensibles (caso de prueba 5 de la ISSUE 04) |
| 3 | Timeouts finitos en llamadas al proveedor externo (Gemini) (REQ-12) | `09-gemini-adapter` (REQ-03 ya lo exige) | Test con provider colgado expira por timeout (caso de prueba 6 de la ISSUE 04) |
| 4 | Rate limiting del endpoint de recomendaciones | `11-api-layer` (ya declarado fuera de alcance en la ISSUE 04) | Rate limit activo y testeado |
| 5 | Autorización a nivel de aplicación respaldada por RLS, nunca solo UI (REQ-08, segunda mitad) | `05-supabase-auth` + `07-application-layer` + `08-infrastructure-supabase` | Casos de uso usan cliente con claims de usuario; revisión de que ninguna capa confía en la UI |
| 6 | Tests E2E de seguridad: casos S1–S5 con dos usuarios reales (espejo de REQ-01…REQ-06) | `16-testing-strategy` | Playwright/E2E cubre los 6 casos de prueba de la ISSUE 04 contra base real |

## Nota de verificación ya realizada (2026-10-08)

Los casos de prueba 1–4 de la ISSUE 04 se verificaron aquí a nivel SQL contra el proyecto Supabase vinculado, simulando roles con `SET LOCAL ROLE` + `request.jwt.claims` (usuarios A/B y anónimo): aislamiento de `pantry_items`/`favorite_recipes`, catálogos de solo lectura para autenticado, cero filas para anónimo. Queda pendiente la repetición con **usuarios reales vía auth** — ese es el ítem 6.

## Criterios de cierre de esta issue

- [ ] Ítems 1–6 verificados en sus specs responsables.
