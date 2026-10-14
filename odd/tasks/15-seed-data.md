# ODD — Spec 15: Datos de seed (catálogo multicultural)

## Objective

Sembrar el catálogo con contenido original y multicultural mediante migraciones
versionadas: `cuisines`, `ingredients`, `recipes`, `recipe_ingredients`, de modo que
una base recién migrada ya permita probar recomendaciones reales y multicocina.

Especificación: `docs/specs/15-seed-data/SPEC.md` + `ISSUE.md` (fuente: PROMTP #52,
#53, #68).

## Problem

Las migraciones `001`–`003` solo crean el esquema: `cuisines`, `ingredients`,
`recipes` y `recipe_ingredients` están vacías. Sin datos, el motor de recomendación
(spec 10) no tiene candidatos, la UI muestra estados vacíos y los E2E 7–10 (spec 16)
no son ejecutables.

## Why

Sin seed, el principio central del producto («multicocina desde el primer día») no se
puede demostrar ni validar: ni búsquedas reales, ni scores, ni ingredientes faltantes.

## Decisions

- **Cobertura completa de los ejemplos de PROMTP #52** (no solo un subconjunto): el
  dataset se mantiene pequeño (29 recetas, 6 cocinas) pero incluye todas las recetas
  de ejemplo listadas, para que la cobertura de REQ-02 sea verificable sin discusión.
- **Idempotencia sin cambiar el esquema**: `cuisines` y `recipes` usan
  `ON CONFLICT (slug) DO UPDATE` (slug es UNIQUE), `recipe_ingredients` usa
  `ON CONFLICT (recipe_id, ingredient_id)` (índice único existente) e `ingredients`
  usa un guard `WHERE NOT EXISTS` porque `normalized_name` **no** tiene constraint
  UNIQUE (spec 03 solo definió un índice).
- **Sin cambios de esquema**: todo el seed vive en migraciones `INSERT`, sin `ALTER`
  ni constraints nuevos (eso es spec 03).
- **`source = 'INTERNAL'` obligatorio**: `SupabaseRecipeRecommendationCatalog` filtra
  `.eq("source", "INTERNAL")`; una receta sembrada con otro `source` sería invisible
  para las recomendaciones.
- **`normalized_name` = salida del normalizador del dominio** (`trim` + `lowercase` +
  `collapse whitespace`, sin quitar acentos): el test reutiliza
  `normalizeIngredientName` para verificar cada fila.
- **`image_url = NULL`**: no se siembran imágenes externas (evita dependencias de
  assets de terceros y problemas de licencia/copyright).
- **Origen del contenido documentado** en `docs/specs/15-seed-data/CONTENT-ORIGIN.md`
  (REQ-05: original, creado específicamente, basado en conocimiento culinario general).
- **Medición del contenido**: la cantidad de recetas/ingredientes se diseñó para
  ejercitar el matching (recetas 100% cubiertas por despensa típica, recetas con
  faltantes y recetas con ingredientes `optional`).

## Scope

- **In scope:** migraciones de seed `cuisines` → `ingredients` → `recipes` →
  `recipe_ingredients`; documentación de origen del contenido; test que fija los
  criterios de aceptación de la spec.
- **Out of scope:** esquema/tablas (spec 03), RLS (spec 04), datos de usuario,
  contenido externo (Gemini, spec 09), E2E reales (spec 16).
- **Preserve:** pnpm only, migraciones versionadas (nunca `seed.sql` como fuente del
  esquema), copy de producto en español, código/comentarios/tests en inglés.

## Specs

- **S1** (REQ-01/REQ-02) — Seed multicultural: ≥6 cocinas (Colombia, Perú, Argentina,
  México, España, Italia) y recetas de ejemplo que cubren las 6, incluidas todas las
  recetas listadas en PROMTP #52.
- **S2** (REQ-03) — Staples con `is_pantry_staple = true`: sal, pimienta, aceite,
  azúcar, agua, además de los ingredientes que requieren las recetas.
- **S3** (REQ-04) — Cada receta enlaza su `cuisine_id` y sus filas en
  `recipe_ingredients` con cantidad/unidad/`optional`; algunas recetas quedan
  completamente cubiertas por una despensa típica y otras con faltantes.
- **S4** (REQ-05) — Contenido original/creado específicamente; origen documentado; no
  se copia contenido con copyright.
- **S5** (REQ-06) — Los seeds son migraciones versionadas (`004_seed_cuisines.sql` …),
  no inserts manuales.
- **S6** (criterio de aceptación) — Con `papa`, `carne` y `huevo` en la despensa y el
  filtro `Almuerzo` (`LUNCH`), los resultados abarcan **≥2 países distintos**.
- **S7** (criterio de aceptación) — Reaplicar los seeds no duplica filas
  (idempotencia por migración).

## Tasks

- [x] T1 — Rama `feat/15-seed-data`, feature doc + mirror Engram. (inline)
- [x] T2 — Test que fija S1–S7 sobre los archivos de migración (RED primero).
      (inline)
- [x] T3 — `004_seed_cuisines.sql` (6 cocinas, idempotente por slug). (inline)
- [x] T4 — `005_seed_ingredients.sql` (staples + ingredientes de las recetas,
      guard `WHERE NOT EXISTS`). (inline)
- [x] T5 — `006_seed_recipes.sql` (29 recetas por cocina, `source = 'INTERNAL'`,
      idempotente por slug). (inline)
- [x] T6 — `007_seed_recipe_ingredients.sql` (relaciones con cantidad/unidad/optional).
      (inline)
- [x] T7 — `docs/specs/15-seed-data/CONTENT-ORIGIN.md` (REQ-05: origen documentado).
      (inline)
- [x] T8 — Verificación en Postgres real: migraciones 001→007 sobre base limpia +
      búsqueda multicocina + reaplicación sin duplicados. (inline)
- [x] T9 — `pnpm lint && pnpm typecheck && pnpm test` + actualización del doc y
      commits de work-unit. (inline)

## Route declaration

Delegación de escritura **no aplicable**: los cuatro artefactos comparten el mismo
dataset (los `recipe_ingredients` referencian los slugs de `recipes` y los
`normalized_name` de `ingredients`), por lo que no hay superficies disjuntas para
escritores en paralelo; el trabajo es un cambio contiguo y entendido. Todo inline.
Contexto del padre dentro del presupuesto (lecturas acotadas por lote).

## Forecast & delivery

- Forecast: ~700–900 líneas autoradas (4 migraciones + test + doc de contenido).
- Supera el presupuesto advisory de ~400 → estrategia de entrega `ask-on-risk`
  (por defecto). Igual que specs 12/13/14, la consulta de estrategia de cadena se
  difiere a la creación del PR; este workflow no abre PR. Commits de work-unit en
  `feat/15-seed-data`.

## Progress / evidence

- **T3–T6 — migraciones.** `004_seed_cuisines.sql`: 6 cocinas.
  `005_seed_ingredients.sql`: ingredientes (5 staples marcados) con guard
  `WHERE NOT EXISTS` sobre `normalized_name`. `006_seed_recipes.sql`: 29 recetas
  repartidas 10/4/4/4/3/4 por cocina, todas `source = 'INTERNAL'`.
  `007_seed_recipe_ingredients.sql`: relaciones con cantidad/unidad/notas/optional.
- **T2 — test.** `tests/unit/seed/seed-migrations.test.ts` parsea los `VALUES` de las
  migraciones de seed y fija S1–S7 (cocinas, staples, integridad referencial,
  `normalized_name` contra `normalizeIngredientName`, cobertura multicocina y guards
  de idempotencia). RED observado antes de escribir las migraciones; GREEN después.
- **T8 — Postgres real.** Migraciones 001→007 aplicadas en un `postgres:16-alpine`
  efímero (con shim de `auth.users`/`auth.uid()`/roles de Supabase) + reaplicación de
  los seeds para comprobar idempotencia.
- **T9 — calidad.** `pnpm lint` limpio, `pnpm typecheck` limpio, `pnpm test` en verde.

Commit de work-unit (feature branch `feat/15-seed-data`):
`feat(seed): seed the multicultural recipe catalog` → migraciones 004–007, el test
de contrato de seeds y `CONTENT-ORIGIN.md` en una misma unidad verde (el test exige
que el doc de origen exista).

### Verification (comandos y resultados observados)

| Comando | Resultado |
| --- | --- |
| `pnpm test tests/unit/seed/seed-migrations.test.ts` (RED) | 18 failed + 5 passed sobre archivos ausentes (`ENOENT … 004_seed_cuisines.sql`) |
| `pnpm test tests/unit/seed/seed-migrations.test.ts` (GREEN) | 23 passed (23) |
| `pnpm test` (suite completa) | 50 archivos / 333 tests passed (310 previos + 23 nuevos) |
| `pnpm lint` | limpio |
| `pnpm typecheck` | limpio |
| Postgres 16 efímero + 001→007 | `cuisines 6 / ingredients 55 / recipes 29 / relations 229 / staples 5`; `recipes_without_cuisine 0`; `non_internal_sources 0`; países con papa/carne/huevo = 6; países con papa en `LUNCH` = 5; imágenes externas 0; relaciones sin unidad 0 |
| Reaplicación de `004→007` (idempotencia) | `6/55/29/229` antes y después → **sin duplicados** |

`pnpm format:check` no es un gate del proyecto y ya fallaba antes de este cambio
(~70 archivos previos sin formatear); el archivo nuevo se escribió con Prettier.
`pnpm build` no se ejecutó: este cambio no toca código de aplicación ni el bundle
(solo migraciones SQL, tests y documentación).

Evidencia del Postgres efímero (`postgres:16-alpine` + shim de `auth.users`,
`auth.uid()` y roles `anon/authenticated/service_role`):

```text
 cuisines | ingredients | recipes | relations | staples | recipes_without_cuisine | non_internal_sources | countries_with_papa_carne_huevo | lunch_countries
----------+-------------+---------+-----------+---------+-------------------------+----------------------+---------------------------------+-----------------
        6 |          55 |      29 |       229 |       5 |                       0 |                    0 |                               6 |               5
```

Recetas `LUNCH` que contienen papa (mínimo multi-país verificado):

```text
 Colombia  Sudado de pollo
 Colombia  Ajiaco
 España    Tortilla española
 Perú      Causa limeña
 Perú      Lomo saltado
```


## Acceptance criteria

- [x] Aplicar las migraciones siembra ≥6 cocinas y un conjunto funcional de recetas.
- [x] Banderas `is_pantry_staple` para sal/pimienta/aceite/azúcar/agua.
- [x] Búsqueda `papa, carne, huevo` + `Almuerzo` → recetas de ≥2 países distintos.
- [x] Contenido original con origen documentado (`CONTENT-ORIGIN.md`).
- [x] Seeds como migraciones versionadas, repetibles (idempotentes).

## Next step

- Push / PR / merge: decisión del usuario (estrategia `ask-on-risk` diferida a la
  creación del PR).
- Los E2E reales que consumen este seed pertenecen a la spec 16.

## Log

**L1 (pedido original del usuario, verbatim):**

> @docs/specs/15-seed-data/ implementa esta spec

**L2 (evidencia de implementación — RED observado):** test escrito antes de las
migraciones; `pnpm test tests/unit/seed/seed-migrations.test.ts` → `18 failed | 5
passed`, fallando con `ENOENT … supabase/migrations/004_seed_cuisines.sql` y
`docs/specs/15-seed-data/CONTENT-ORIGIN.md` ausente.

**L3 (evidencia de verificación):** GREEN 23/23 en el test de seeds; suite completa
333/333; `pnpm lint` y `pnpm typecheck` limpios; migraciones aplicadas de cero en un
`postgres:16-alpine` efímero (6 cocinas / 55 ingredientes / 29 recetas / 229
relaciones, 5 staples, 0 recetas sin cocina, 0 fuentes no internas) y reaplicación de
los seeds sin duplicados. Commits de work-unit en `feat/15-seed-data`.

**L3.1 (decisión de contenido):** se incluyeron **todas** las recetas de ejemplo de
PROMTP #52 (29 recetas) en lugar del subconjunto mínimo, para que la cobertura de la
6 gastronomías sea verificable; el volumen sigue siendo pequeño para el MVP.

**L4 (reparación de estructura del doc):** las entradas L1–L3.1 habían quedado
insertadas antes de la tabla de verificación; se movieron bajo este `## Log` y se
restauró el encabezado `### Verification (comandos y resultados observados)`.
