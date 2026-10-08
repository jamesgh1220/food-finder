# ISSUE: 03 — Esquema de base de datos y migraciones

## Título

Diseñar el esquema Supabase (tablas, índices, constraints) con migraciones versionadas y tipos generados

## Descripción

La base de datos es el cimiento de pantry, favoritos, recetas y recomendaciones. Hay que crear las 7 tablas MVP con sus columnas, constraints e índices, todo respaldado por migraciones versionadas en el repo (no solo en Supabase Cloud), con tipos TypeScript generados desde el esquema real y `cuisines` como catálogo extensible — nunca como enum rígido.

## Objetivo

Un esquema completo, aplicable de forma repetible en cualquier entorno, con los índices mínimos de desempeño y las reglas de datos multicocina correctas (catálogo de cocinas, país ≠ cocina).

## Alcance

- Tablas: `profiles`, `cuisines`, `ingredients`, `recipes`, `recipe_ingredients`, `pantry_items`, `favorite_recipes` (+ preparación para `recipe_tags`/`dietary_tags`).
- Columnas y constraints según PROMTP #19 (slug único, `UNIQUE(user_id, recipe_id)` en favoritos, anti-duplicados en pantry).
- Índices mínimos de PROMTP #69.
- Migraciones versionadas en `supabase/migrations/` (PROMTP #68).
- Generación de `src/types/database.types.ts` (PROMTP #58).
- Configuración del MCP de Supabase + workflow de migraciones (PROMTP #23–#25).
- Reglas multicocina (PROMTP #84) y país vs cocina (PROMTP #85).

**Fuera de alcance:** RLS (spec 04), seed de contenido (spec 15), repositorios (spec 08).

## Casos de prueba

1. Las migraciones aplican limpias en una base nueva.
2. `recipes.slug`, `favorite_recipes(user_id, recipe_id)` y el unique de `pantry_items` rechazan duplicados.
3. Búsqueda case-insensitive: un `SELECT` con `TOMATE` encuentra la fila `Tomate` vía `normalized_name`.
4. `INSERT INTO cuisines` agrega una cocina sin tocar código TypeScript ni SQL de esquema.
5. Regenerar tipos produce cambios coherentes y `pnpm typecheck` pasa.
6. Un cambio hecho vía MCP queda reflejado en un archivo de migración versionado.

## Consideraciones técnicas

- No asumir que el proyecto Supabase está vacío: inspeccionar antes de migrar (PROMTP #25).
- Mantener la distinción MCP (tooling de desarrollo) vs SDK (runtime) vs Auth (usuarios) (PROMTP #24).
- No crear índices innecesarios; revisar si se necesitan adicionales y justificarlos.
- El esquema NO puede vivir solo en `seed.sql`.

## Criterios de aceptación

- [x] Las 7 tablas existen con columnas/constraints exactos del SPEC.
- [x] Los 10 índices mínimos creados.
- [ ] Migraciones versionadas en repo y aplicables de forma repetible.
  - Archivo versionado presente (`supabase/migrations/001_initial_schema.sql`), pero la re-aplicación no es 100% idempotente: los `CREATE TRIGGER` no llevan `DROP TRIGGER IF EXISTS` previo. La aplicación remota solo consta por el registro de la sesión anterior (no re-verificada).
- [x] `database.types.ts` generado (comando documentado) y sincronizado.
  - Comandos `pnpm db:types` / `pnpm db:push` documentados en `package.json`; coherencia del archivo con la migración verificada por lectura (tablas y foráneas coinciden). No se re-generó contra la BD viva en esta revisión.
- [ ] Workflow MCP documentado y seguido en esta misma tarea.
  - El MCP está configurado con scope de proyecto en `opencode.json` (REQ-14), pero no existe documentación del workflow de migraciones en el repo.

## Resultado esperado

Esquema Supabase completo y versionado, con índices, constraints y tipos TypeScript generados, listo para que RLS, repositorios y features se apoyen en datos correctos desde el primer día.

## Registro de implementación

- **Estado:** Parcial — esquema, índices y tipos entregados; quedan pendientes la documentación del workflow MCP y la idempotencia total de la re-aplicación (ver Verificación).
- **Fecha / rama / commits:** 2026-10-08, rama `main` (commit directo): `2b51adf` (migraciones de esquema Supabase y tipos generados).
- **Qué se hizo:**
  - `supabase/migrations/001_initial_schema.sql` con las 7 tablas (REQ-01): `profiles`, `cuisines`, `ingredients`, `recipes`, `recipe_ingredients`, `pantry_items`, `favorite_recipes`; `slug` único, `UNIQUE(user_id, recipe_id)` en favoritos y anti-duplicados usuario+ingrediente en pantry; función `update_updated_at_column()` con triggers.
  - Los 10 índices mínimos de PROMTP #69 (REQ-09) más índices adicionales justificados (`cuisines.name/slug`, unique de `recipe_ingredients`).
  - `src/types/database.types.ts` generado desde el esquema; comandos `db:types` y `db:push` documentados en `package.json` (REQ-13).
  - MCP de Supabase configurado con scope de proyecto en `opencode.json`, sin credenciales hardcodeadas (REQ-14).
  - `cuisines` como catálogo extensible (tabla, no enum; PROMTP #84) y `cuisine`/`country`/`region` como columnas separadas (PROMTP #85).
- **Cambios respecto al plan original:**
  - Corrección del contrato de entorno: el archivo real es `.env` (no existe `.env.local`); `.gitignore` ignora `.env*` salvo `.env.example`. README y la cabecera de `.env.example` aún instruyen copiar a `.env.local` — documentación pendiente de corregir.
  - `NEXT_PUBLIC_SUPABASE_URL` apunta a `https://vhjxhqaowxonmtgusskt.supabase.co` sin sufijo `/rest/v1/` (registro de la sesión anterior; no re-verificado en esta revisión, la lectura de `.env` queda fuera de alcance).
  - No existe una feature doc en `odd/tasks/` para esta spec (a diferencia de 01 y 02): el registro vive en el commit y en esta ISSUE.
- **Dependencias:** depende de `01-project-scaffold` (implementada). Referencias cruzadas en "Fuera de alcance": dependen de esta `04-security-rls` (RLS), `08-infrastructure-supabase` (repositorios) y `15-seed-data` (contenido) — las tres pendientes, como el resto de 04–17.
- **Verificación** (ejecutada el 2026-10-08 sobre `main`): `pnpm lint` → 0; `pnpm typecheck` → 0; `pnpm test` → 7/7. Lectura de la migración: 7 tablas con las columnas/constraints de REQ-03…REQ-08 y los 10 índices de REQ-09 presentes. `src/types/database.types.ts` contiene las 7 tablas con foráneas coincidentes con la migración. `opencode.json` contiene el MCP project-scoped (`project_ref=vhjxhqaowxonmtgusskt`). No verificado: re-aplicación remota de la migración y regeneración de tipos contra la BD viva. Hallazgo: los `CREATE TRIGGER` carecen de cláusula idempotente, por lo que re-ejecutar la migración fallaría si los triggers ya existen.
