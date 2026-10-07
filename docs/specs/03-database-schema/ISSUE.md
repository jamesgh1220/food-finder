# ISSUE: 03 — Database Schema & Migrations

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
- Migraciones versionadas en `supabase/migrations/` (#68).
- Generación de `src/types/database.types.ts` (#58).
- Configuración del MCP de Supabase + workflow de migraciones (#23–#25).
- Reglas multicocina (#84) y country vs cuisine (#85).

**Fuera de alcance:** RLS (spec 04), seed de contenido (spec 15), repositorios (spec 08).

## Casos de prueba

1. Migraciones aplican limpias en una base nueva.
2. `recipes.slug`, `favorite_recipes(user_id, recipe_id)` y el unique de `pantry_items` rechazan duplicados.
3. Búsqueda case-insensitive: `SELECT` con `TOMATE` encuentra la fila `Tomate` vía `normalized_name`.
4. `INSERT INTO cuisines` agrega una cocina sin tocar código TypeScript ni SQL de esquema.
5. Regenerar tipos produce cambios coherentes y `npm run typecheck` pasa.
6. Cambio hecho vía MCP queda reflejado en un archivo de migración versionado.

## Consideraciones técnicas

- No asumir que el proyecto Supabase está vacío: inspeccionar antes de migrar (#25).
- Mantener la distinción MCP (tooling de desarrollo) vs SDK (runtime) vs Auth (usuarios) (#24).
- No crear índices innecesarios; revisar si se necesitan adicionales y justificarlos.
- El schema NO puede vivir solo en `seed.sql`.

## Criterios de aceptación

- [ ] Las 7 tablas existen con columnas/constraints exactos del SPEC.
- [ ] Los 10 índices mínimos creados.
- [ ] Migraciones versionadas en repo y aplicables de forma repetible.
- [ ] `database.types.ts` generado (comando documentado) y sincronizado.
- [ ] Workflow MCP documentado y seguido en esta misma tarea.

## Resultado esperado

Esquema Supabase completo y versionado, con índices, constraints y tipos TypeScript generados, listo para que RLS, repositorios y features se apoyen en datos correctos desde el primer día.
