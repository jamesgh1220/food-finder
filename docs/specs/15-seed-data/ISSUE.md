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

**Fuera de alcance:** esquema (spec 03), datos de usuario, contenido externo de Spoonacular.

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

- [ ] Seed completo aplicable desde cero vía migraciones.
- [ ] Cobertura de las 6 gastronomías del SPEC con sus recetas de ejemplo.
- [ ] Staples marcados correctamente.
- [ ] Búsqueda multi-país verificada (Caso 2 de aceptación general del PROMPT).
- [ ] Contenido con copyright revisado y documentado.

## Resultado esperado

Catálogo multicultural sembrado y reproducible que alimenta las demos, los tests E2E y la validación del algoritmo de recomendación desde el primer despliegue.
