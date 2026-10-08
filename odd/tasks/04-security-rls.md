# ODD — Spec 04: Row Level Security y seguridad del backend

## Objetivo
Hacer efectivo el aislamiento de datos por usuario: RLS habilitado en las 7 tablas del esquema con políticas coherentes con REQ-01…REQ-07, verificado contra la base real. Ítems de código backend sin consumidores hoy quedan registrados en una issue local de diferidos.

## Por qué
La ISSUE de la spec 04 marca un fallo aquí como bloqueante: sin RLS, cualquier usuario puede leer/modificar datos de otro usuario.

## Alcance autorizado (decisión A, aprobada por el usuario)
- **Dentro:** migración `supabase/migrations/002_rls_policies.sql` (RLS + políticas REQ-01…REQ-07), aplicación a la base vinculada (`pnpm db:push`, autorizado), verificación SQL de comportamiento con roles/usuarios simulados, verificación de que no hay secretos expuestos hoy (REQ-10/11), `docs/specs/04-security-rls/ISSUE-DEFERRED.md` con lo diferido, actualización de `docs/specs/04-security-rls/ISSUE.md` (convención del proyecto).
- **Fuera de alcance (diferido, issue local):** validación Zod de entradas backend, saneamiento de errores de API, timeout Spoonacular, rate limiting (spec 11), flujos auth (spec 05), tests E2E seguridad (spec 16).
- **Fuera de alcance (prohibido):** scaffolding especulativo sin consumidores.

## Restricciones
- pnpm ONLY. UI copy español; código/comentarios/commits en inglés.
- Hexagonal: no importar hacia dentro; RLS es migración SQL, no lógica de negocio en componentes.
- Rama feature primero (estamos en `main`).
- TDD estricto: NO configurado → checks funcionales ordinarios: `pnpm lint && pnpm typecheck && pnpm test`.
- RDD: off (clone-local) → sin ceremonia de revisión.
- Entrega: estrategia `ask-on-risk`, presupuesto 400 líneas/PR.
- Convención: al cerrar, actualizar `docs/specs/04-security-rls/ISSUE.md`.
## Tareas

- [x] T1 — Rama `feat/04-security-rls` desde `main`
- [x] T2 — Escribir `supabase/migrations/002_rls_policies.sql`: `ENABLE ROW LEVEL SECURITY` en las 7 tablas; políticas:
  - [x] `profiles` (REQ-01): select/insert/update/delete propias (`id = auth.uid()`)
  - [x] `pantry_items` (REQ-02): select/insert/update/delete propias (`user_id = auth.uid()`)
  - [x] `favorite_recipes` (REQ-03): select/insert/update/delete propias (`user_id = auth.uid()`)
  - [x] `recipes` (REQ-04): select solo `authenticated`; sin políticas de escritura
  - [x] `ingredients` (REQ-05): select solo `authenticated`; sin escritura
  - [x] `cuisines` (REQ-06): select solo `authenticated`; sin escritura
  - [x] `recipe_ingredients` (REQ-07): select solo `authenticated`; sin escritura
- [x] T3 — `pnpm db:push` a la base vinculada + verificar con SQL que las 7 tablas tienen RLS y las políticas esperadas existen *(7/7 RLS=true, 16 políticas)*
- [x] T4 — Verificación de comportamiento (casos 1–4 de la ISSUE) con roles/usuarios simulados vía SQL *(PASS: A, B simétrico, anónimo; fixtures limpiados a 0)*
- [x] T5 — Barrido REQ-10/11: sin secretos `NEXT_PUBLIC_*`, sin `.env` trackeado, sin stacks en `src/`
- [x] T6 — Crear `docs/specs/04-security-rls/ISSUE-DEFERRED.md` *(6 ítems con specs responsables: 09, 11, 05/07/08, 16)*
- [x] T7 — Actualizar `docs/specs/04-security-rls/ISSUE.md`: criterios verificados + registro de implementación
- [x] T8 — `pnpm lint && pnpm typecheck && pnpm test` (7/7) + commit `250eb1c`

## Criterios de aceptación

- [x] Las 7 tablas con RLS habilitado y al menos una política coherente por REQ-01…REQ-06; ninguna tabla sin protección (REQ-07).
- [x] Usuario A obtiene 0 filas del pantry/favoritos de usuario B (verificado en base real).
- [x] Sin escrituras de usuarios en catálogos globales.
- [x] Sin secretos con prefijo público ni stack traces en el código actual.
- [x] `pnpm lint && pnpm typecheck && pnpm test` en verde.

## Progreso / evidencia

- Commit: `250eb1c feat(db): enable RLS policies for all tables (spec 04)` (rama `feat/04-security-rls`, 233 añadidas/5 borradas — bajo el presupuesto de 400, slice único).
- BD vinculada: migración `002_rls_policies.sql` aplicada vía `pnpm db:push`.
- Aerciones SQL PASS: `PASS_cases_1_2_4_user_A`, `PASS_user_B_symmetric`, `PASS_case_3_anonymous`.
- Checks: lint ✅ · typecheck ✅ · test 7/7 ✅.
- RDD off (clone-local) → sin ciclo de revisión.

## Siguiente paso

- Tarea completada. Push/PR/merge quedan como decisión del usuario (política ordinaria del repo).
