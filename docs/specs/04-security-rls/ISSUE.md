# ISSUE: 04 — Row Level Security y seguridad del backend

## Título

Configurar RLS por tabla y la línea base de seguridad del backend (autorización, validación, secretos, errores)

## Descripción

Con las tablas creadas, el siguiente paso es aislar los datos por usuario con Row Level Security y fijar la línea base de seguridad: autorización respaldada por backend/RLS (nunca solo por la UI), validación Zod de todo input, protección de secretos y manejo seguro de errores. Un fallo aquí expone datos de otros usuarios, por lo que se trata como bloqueante.

## Objetivo

Garantizar que cada usuario solo vea y modifique sus propios datos (perfil, despensa, favoritos), que los catálogos globales sean de solo lectura para usuarios, y que ninguna respuesta exponga secretos ni detalles internos.

## Alcance

- Políticas RLS para `profiles`, `pantry_items`, `favorite_recipes` (usuario propio) y `recipes`, `ingredients`, `cuisines` (solo lectura para autenticados, sin escritura arbitraria).
- Habilitar RLS en **todas** las tablas.
- Autorización a nivel backend/caso de uso.
- Validación Zod de inputs e IDs.
- Protección de secretos y errores seguros.
- Timeouts en llamadas externas.

**Fuera de alcance:** tests E2E de seguridad (spec 16), rate limiting (spec 11), flujos de auth (spec 05).

## Casos de prueba

1. Usuario A no puede leer ni modificar el pantry de usuario B (select/update/delete devuelven 0 filas).
2. Usuario A no puede modificar favoritos de usuario B.
3. Un usuario no autenticado no obtiene filas de tablas RLS de usuario.
4. Los usuarios autenticados pueden leer `recipes`/`ingredients`/`cuisines` pero no escribir en ellas.
5. Ninguna respuesta de error incluye stack trace, SQL ni valores de `.env`.
6. Una llamada a Spoonacular colgada expira por timeout en lugar de bloquear la request.

## Consideraciones técnicas

- RLS es la última línea de defensa: la autorización de la UI nunca es suficiente (#56).
- Las políticas deben ser testeables con usuarios reales (dos usuarios distintos) — los checks 1–3 son los mínimos.
- Validar IDs y cantidades también en el servidor aunque la UI ya lo valide.

## Criterios de aceptación

- [x] RLS habilitado en todas las tablas del esquema. *(7/7 tablas verificadas en la base vinculada)*
- [x] Cada tabla tiene la política descrita en el SPEC (REQ-01…REQ-06). *(16 políticas; ver `002_rls_policies.sql`)*
- [x] Casos de prueba 1–4 verificados contra una base real con dos usuarios. *(verificados con sesiones simuladas: `SET LOCAL ROLE` + `request.jwt.claims` para A, B y anónimo; la repetición con usuarios reales vía auth queda en `ISSUE-DEFERRED.md` ítem 6 / spec 16)*
- [x] Ningún código devuelve secretos ni stack traces al cliente. *(barrido grep: sin secretos referenciados en `src/`, sin `.env` trackeado; el código de error llega con las specs 09/11)*
- [ ] Validación Zod presente en todas las entradas de datos del backend. *(diferido — no existen entradas backend aún; spec 11. Ver `ISSUE-DEFERRED.md`)*

## Registro de implementation

**Estado:** completado con ítems diferidos (2026-10-08, rama `feat/04-security-rls`)

**Qué se hizo:**
- `supabase/migrations/002_rls_policies.sql`: RLS habilitado en las 7 tablas; 16 políticas — `profiles`/`pantry_items`/`favorite_recipes` con select/insert/update/delete propio (`= auth.uid()`), `recipes`/`ingredients`/`cuisines`/`recipe_ingredients` con select solo `authenticated` y sin políticas de escritura. Migración aplicada con `pnpm db:push` a la base vinculada.
- Verificación SQL de comportamiento (casos 1–4): aislamiento A↔B en pantry/favoritos, controles positivos de escritura propia, rechazo de escritura en catálogos, cero filas para anónimo — todo PASS, fixtures limpiados.
- Barrido de secretos (REQ-10/11) sobre `src/` y `.env`: sin hallazgos.
- `ISSUE-DEFERRED.md`: ítems Zod/errores/timeouts/rate limiting/autorización de app/E2E con specs responsables.

**Cambios vs plan:** alcance reducido a "solo RLS" (decisión del usuario); la checklist de código backend sin consumidores se difirió en lugar de generar scaffolding especulativo.

**Dependencias:** `03-database-schema` ✅ · `05-supabase-auth` pendiente (políticas listas para cuando exista la identidad de sesión; verificadas con claims simulados).

**Verificación:** `pnpm db:push` OK · aserciones SQL PASS (A, B, anónimo) · pendiente `pnpm lint && pnpm typecheck && pnpm test` al cierre de la rama.

## Resultado esperado

Aislamiento de datos por usuario garantizado a nivel de base de datos, catálogos globales protegidos de escritura y un backend que nunca filtra secretos ni detalles internos — la seguridad verificada por los tests E2E de la spec 16.
