# ISSUE: 15 — Seed Data

## Título

Crear el seed multicultural (cuisines, ingredientes, recetas internas) con contenido original y migrations versionadas

## Descripción

El seed demuestra el principio central del producto: multicocina desde el primer día. Hay que sembrar catálogos y recetas internas de al menos 6 gastronomías (Colombia, Perú, Argentina, México, España, Italia), con ingredientes staple marcados y contenido 100% original — nunca recetas copiadas de sitios con copyright.

## Objetivo

Una base de datos recién migrada que ya permite probar recomendaciones reales: buscar `papa, carne, huevo` devuelve recetas de distintos países.

## Alcance

- Migraciones de seed para `cuisines`, `ingredients`, `recipes`, `recipe_ingredients`.
- Recetas de ejemplo por gastronomía (lista del PROMPT #52; el dataset final puede ser menor).
- Staples marcados `is_pantry_staple` (sal, pimienta, aceite, azúcar, agua).
- Reglas de contenido original/copyright (#53).

**Fuera de alcance:** esquema (spec 03), datos de usuario, contenido externo (Gemini).

## Casos de prueba

1. BD nueva + migraciones → ≥6 cuisines y recetas sembradas visibles.
2. `papa, carne, huevo` + `Almuerzo` → resultados de al menos 2 países distintos entre sí.
3. Staples (sal) marcados como `is_pantry_staple` en la tabla `ingredients`.
4. Cada receta sembrada tiene `cuisine_id` válido y sus `recipe_ingredients`.
5. Reaplicar seeds no duplica filas (idempotencia por migración).
6. Auditoría de contenido: cada receta es original/creada o legalmente distribuible.

## Consideraciones técnicas

- Los seeds van en migraciones versionadas (`003_seed_cuisines.sql`, `004_seed_recipes.sql`), coherentes con la política de la spec 03.
- Diseñar el set para ejercitar el matching: algunas recetas completamente coincidentes con lo sembrado, otras con faltantes (para probar scores y "ingredientes faltantes").
- No copiar masivamente de sitios de recetas; contenido culinario general propio (#53).

## Criterios de aceptación

- [x] Seed completo aplicable desde cero vía migraciones. *(migraciones versionadas `004_seed_cuisines.sql` … `007_seed_recipe_ingredients.sql`; aplicadas 001→007 en un Postgres 16 efímero y luego al proyecto Supabase real el 2026-10-14)*
- [x] Cobertura de las 6 gastronomías del SPEC con sus recetas de ejemplo. *(6 cocinas; 29 recetas repartidas 10/4/4/4/3/4)*
- [x] Staples marcados correctamente. *(5: sal, pimienta, aceite, azúcar, agua)*
- [ ] Búsqueda multi-país verificada (Caso 2 de aceptación general del PROMPT). *(**parcial**: el **dato** ya lo habilita — una consulta sobre el catálogo real devuelve recetas de 6 países que matchean `papa`/`carne`/`huevo`; falta el E2E de la app, spec 16)*
- [x] Contenido con copyright revisado y documentado. *(`docs/specs/15-seed-data/CONTENT-ORIGIN.md`)*

## Resultado esperado

Catálogo multicultural sembrado y reproducible que alimenta las demos, los tests E2E y la validación del algoritmo de recomendación desde el primer despliegue.

## Evidencia de implementación (implementado 2026-10-13 · registrado 2026-10-13)

**Estado:** entregada a nivel de migraciones + test; **el entorno real quedó a medio aplicar**.

**Commits de work-unit** en `feat/15-seed-data`: `b1941c7` `feat(seed): seed the multicultural recipe catalog` · `0f2dddc` (registro).

- **Migraciones:** `004_seed_cuisines.sql` (6 cocinas) · `005_seed_ingredients.sql` (55 ingredientes, 5 staples, guard `WHERE NOT EXISTS` sobre `normalized_name`) · `006_seed_recipes.sql` (29 recetas, `source = 'INTERNAL'`) · `007_seed_recipe_ingredients.sql` (relaciones con cantidad, unidad, notas y `optional`).
- **Nota de numeración:** las "Consideraciones técnicas" del `ISSUE` y el `p. ej.` de REQ-06 mencionan `003_seed_cuisines.sql`/`004_seed_recipes.sql`. El `003` ya estaba tomado por `003_recipe_ingredient_optionality.sql`, así que el seed real ocupa `004`–`007`. El requisito habla de migraciones versionadas, no de números fijos.
- **Test:** `tests/unit/seed/seed-migrations.test.ts` parsea los `VALUES` de las migraciones y fija S1–S7 (cocinas, staples, integridad referencial, `normalized_name` contra `normalizeIngredientName`, cobertura multicocina y guards de idempotencia). RED observado antes de escribir las migraciones; GREEN después.
- **Verificación observada (2026-10-13):** migraciones `001`→`007` aplicadas en un `postgres:16-alpine` efímero con shim de `auth.users`/`auth.uid()`/roles de Supabase; reaplicación sin duplicar filas (idempotencia). Detalle completo en `odd/tasks/15-seed-data.md`.
- **Contenido original:** `docs/specs/15-seed-data/CONTENT-ORIGIN.md` documenta la regla de autoría (conocimiento culinario general, contenido escrito para Food Finder) y que no se copiaron recetas de sitios con copyright.

### Aplicación al proyecto real (verificado 2026-10-14)

Contra el proyecto Supabase real, verificado con `execute_sql` tras aplicar `006` y `007`:

| tabla | filas |
|---|---|
| `cuisines` | 6 |
| `ingredients` | 55 (5 staples: aceite, agua, azúcar, pimienta, sal) |
| `recipes` | 29 |
| `recipe_ingredients` | 229 |

Reparto por cocina: Colombia 10 · Perú 4 · Italia 4 · México 4 · Argentina 4 · España 3.

`list_migrations` muestra las 7 migraciones aplicadas (`initial_schema`, `rls_policies`, `003_recipe_ingredient_optionality`, `004_seed_cuisines`, `005_seed_ingredients`, `006_seed_recipes`, `007_seed_recipe_ingredients`).

Consulta de humo para el Caso 2 — recetas del catálogo real que contienen al menos una de `papa`/`carne`/`huevo`: devuelve coincidencias de **6 países** (Colombia, Perú, Argentina, México, España, Italia), con `Causa limeña` (Perú) y `Tortilla española` (España) empatando arriba con 2 de 3 claves. El requisito de multi-país queda satisfecho **a nivel de datos**.

**Estado del bloqueo original:** resuelto. El catálogo ya no está vacío, así que "Encontrar recetas" tiene candidatos y los Casos 2/3 dejan de estar bloqueados por datos.

- **Pendiente honesto:** el E2E de la app (spec 16) sigue sin ejecutarse; el seed en sí está completo y aplicado.
