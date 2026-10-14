# Origen del contenido del seed (spec 15, REQ-05 / PROMTP #53)

## Regla aplicada

Todo el contenido sembrado por las migraciones `004_seed_cuisines.sql`,
`005_seed_ingredients.sql`, `006_seed_recipes.sql` y
`007_seed_recipe_ingredients.sql` es **original**, escrito específicamente para Food
Finder a partir de conocimiento culinario general (técnicas, ingredientes y
preparaciones de dominio público). No se copia ninguna receta completa de un sitio
protegido por copyright, ni se reproduce contenido de forma masiva desde sitios de
recetas.

Consecuencias verificables:

- Los textos de `description` e `instructions` fueron redactados para este proyecto.
- Las recetas sembradas llevan `source = 'INTERNAL'` y `source_url = NULL`: no
  referencian ningún recurso externo.
- No se siembran imágenes externas (`image_url = NULL`), evitando assets de terceros
  con licencia desconocida.
- El test `tests/unit/seed/seed-migrations.test.ts` comprueba que ningún archivo de
  seed contiene URLs (`http://` / `https://`).

## Contenido de terceros

El proyecto **no** incorpora recetas de proveedores externos en el seed. Cuando en el
futuro se incorpore contenido externo (por ejemplo, proveedores de recetas), se
respetarán las condiciones y licencias de cada proveedor: el contenido externo se
etiqueta con su `source`/`source_url` y no se persiste como catálogo interno sin
verificar su licencia. Las recetas generadas por IA se marcan `AI_GENERATED` (spec 09)
y nunca se mezclan con el catálogo interno.

## Inventario del seed

- **Cocinas:** 6 (Colombia, Perú, Argentina, México, España, Italia).
- **Ingredientes:** catálogo común con los cinco staples de despensa (`sal`,
  `pimienta`, `aceite`, `azúcar`, `agua`) marcados con `is_pantry_staple = true`.
- **Recetas:** recetas de ejemplo de PROMTP #52 por gastronomía, repartidas entre
  desayuno, almuerzo, cena y merienda, con ingredientes obligatorios y opcionales
  para ejercitar el cálculo de coincidencia y de ingredientes faltantes.

## Referencias

- Regla de copyright del producto: `docs/PROMTP.md` #53.
- Política de migraciones: `docs/PROMTP.md` #68 y spec 03.
- Spec 15: `docs/specs/15-seed-data/SPEC.md` e `ISSUE.md`.
