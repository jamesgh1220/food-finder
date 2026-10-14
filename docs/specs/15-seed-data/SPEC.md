# SPEC: 15 — Datos de seed (catálogo multicultural)

**Fuente:** PROMTP.md #52 (Seed data), #53 (Copyright/contenido), #68 (Migraciones — ubicación del seed).

## Propósito

Sembrar el catálogo con contenido original y multicultural: cocinas, ingredientes y recetas internas de al menos seis gastronomías, para que la aplicación demuestre su principio multicocina desde el primer día.

## Alcance

### Dentro del alcance
- Migraciones/SQL de seed para `cuisines`, `ingredients`, `recipes`, `recipe_ingredients`.
- Reglas de contenido (originalidad/copyright).

### Fuera del alcance
- Definición del esquema (spec 03), datos de usuario, contenido externo (Gemini).

## Requisitos

| ID | Requisito |
|----|-----------|
| REQ-01 | El seed debe ser **multicultural**. NO sembrar solo recetas colombianas. Incluir un conjunto pequeño pero útil de distintas gastronomías. |
| REQ-02 | Cobertura mínima de cocinas con recetas de ejemplo: **Colombia** (huevos pericos, arepa con queso, calentado, changua, sudado de pollo, arroz con pollo, fríjoles, ajiaco, patacones, arepa con huevo), **Perú** (causa limeña, lomo saltado, ají de gallina, arroz chaufa), **Argentina** (milanesa, empanadas, choripán, carne al horno), **México** (tacos de carne, quesadillas, huevos rancheros, chilaquiles), **España** (tortilla española, patatas bravas, gazpacho), **Italia** (pasta al pomodoro, pasta aglio e olio, frittata, risotto). El dataset final del MVP puede ser menor — son ejemplos, no una cuota. |
| REQ-03 | Los ingredientes sembrados deben incluir staples con `is_pantry_staple = true` (sal, pimienta, aceite, azúcar, agua) además de los ingredientes que requieren las recetas del seed. |
| REQ-04 | Cada receta sembrada enlaza su fila en `cuisines` y sus filas en `recipe_ingredients` con cantidades/unidades/banderas `optional`; las recetas deben ejercitar el algoritmo de matching (algunas completamente coincidentes con los ingredientes sembrados, otras con faltantes). |
| REQ-05 | El contenido debe ser original, creado específicamente, basado en conocimiento culinario general o legalmente distribuible. **No** copiar recetas completas de sitios con copyright ni copiar masivamente contenido de sitios de recetas. Respetar las licencias de los proveedores externos para contenido externo. |
| REQ-06 | Los seeds viven como migraciones versionadas (p. ej. `003_seed_cuisines.sql`, `004_seed_recipes.sql`), coherentes con la política de migraciones de la spec 03 — no inserts manuales ad-hoc. |

## Dependencias

- `03-database-schema` (las tablas deben existir).

## Criterios de aceptación

- [x] Aplicar las migraciones siembra ≥6 cocinas y un conjunto de recetas funcional que las abarque. *(6 cocinas, 55 ingredientes y 29 recetas en `004`–`007`; verificado en un Postgres 16 efímero y aplicado al proyecto real el 2026-10-14)*
- [x] Banderas `is_pantry_staple` presentes para sal/pimienta/aceite/azúcar/agua. *(5 marcadas)*
- [ ] Una búsqueda con `papa, carne, huevo` retorna coincidencias del seed de al menos dos países distintos. *(**parcial**: sobre el catálogo real la consulta devuelve coincidencias de 6 países — verificado el 2026-10-14; falta el E2E de la app, spec 16)*
- [x] Todo el contenido sembrado pasa la regla de copyright (REQ-05) — origen documentado. *(`docs/specs/15-seed-data/CONTENT-ORIGIN.md`)*
- [x] Los seeds son migraciones repetibles, no inserts manuales solo en la nube. *(4 archivos versionados + guards de idempotencia + test `tests/unit/seed/seed-migrations.test.ts`)*

## Verificación

Migración en base de datos nueva + la comprobación de búsqueda multicocina anterior (cubierta por los E2E de la spec 16).

**Evidencia observada (2026-10-13):** migraciones `001`→`007` aplicadas en un `postgres:16-alpine` efímero con shim de `auth`; reaplicación idempotente sin duplicados. Test de migraciones de seed en GREEN tras observar RED. Detalle completo en `odd/tasks/15-seed-data.md`.

**Evidencia observada en el entorno real (2026-10-14):** las 7 migraciones quedaron aplicadas en el proyecto Supabase; `recipes` = 29 y `recipe_ingredients` = 229. Una consulta con las claves `papa`/`carne`/`huevo` devuelve coincidencias de 6 países, así que el requisito multi-país queda satisfecho a nivel de datos.

## Implementación (resultado) — 2026-10-13

**Estado:** migraciones y test entregados; **aplicación al proyecto real incompleta**.

- **Archivos:** `004_seed_cuisines.sql`, `005_seed_ingredients.sql`, `006_seed_recipes.sql`, `007_seed_recipe_ingredients.sql` bajo `supabase/migrations/`.
- **Datos:** 6 cocinas (Colombia, Perú, Argentina, México, España, Italia), 55 ingredientes con 5 staples, 29 recetas `source = 'INTERNAL'` repartidas 10/4/4/4/3/4, y sus relaciones con cantidad, unidad, notas y `optional`.
- **Idempotencia:** guards `WHERE NOT EXISTS` sobre `normalized_name` en ingredientes y cocinas; el test fija la regla y la reaplicación en el Postgres efímero la confirma.
- **Contenido:** `docs/specs/15-seed-data/CONTENT-ORIGIN.md` documenta que todo el catálogo es original y escrito para Food Finder.
- **Entorno real (2026-10-14):** las 7 migraciones están aplicadas; `cuisines` 6, `ingredients` 55 (5 staples), `recipes` 29, `recipe_ingredients` 229. El bloqueo de datos que mantenía vacío "Encontrar recetas" quedó resuelto.
- **Pendiente honesto:** el E2E de la app (spec 16) sigue sin ejecutarse; el seed está completo y aplicado.
