# ISSUE: 10 — Motor de recomendaciones y algoritmo de matching

## Título

Implementar RecipeRecommendationService: algoritmo de matching, staples, filtro de cocina opcional, merge y deduplicación

## Descripción

El núcleo del producto es "ingredientes → posibilidades culinarias". Esta spec construye el servicio de recomendación: score base explicable (disponibles/obligatorios), regla de pantry staples, filtro de cocina opcional (default ALL), flujo interno-primero con complemento del proveedor externo (Gemini), deduplicación simple y ordenamiento por relevancia — nunca por fuente de forma ciega.

## Objetivo

Recomendaciones correctas, explicables y multicocina: el usuario ve qué puede cocinar con lo que tiene, con porcentaje de coincidencia, ingredientes disponibles y faltantes, sin que el proveedor externo (Gemini) sea punto único de fallo.

## Alcance

- `RecipeRecommendationService` con contrato de entrada/salida de PROMTP #14.
- Algoritmo MVP: `disponibles obligatorios / total obligatorios` (#15), extensible.
- Pantry staples sin penalización fuerte (#16).
- Filtro de cocina opcional default `ALL` (#17).
- Flujo completo: normalización → interno → (si insuficiente) externo → mapping → matching → merge → dedup → sort (#31).
- Deduplicación por nombre normalizado/source/external id/slug (#33).
- Ordenamiento por relevancia balanceada (#86).
- Forma de resultado con `matchScore` 0–1 y arrays de ingredientes (#71).

**Fuera de alcance:** endpoint HTTP (spec 11), UI de score (spec 14), primitivas de normalización (spec 06), internals del adapter (spec 09).

## Casos de prueba

1. Receta con 5 obligatorios y 4 disponibles → `matchScore = 0.8`.
2. Receta con ingrediente faltante staple (sal) → score claramente mayor que con ingrediente principal faltante.
3. Sin cuisine → resultados de Perú, Argentina, España, etc. (multi-cocina).
4. Con `cuisine = Peruana` → resultados peruanos prioritarios/filtrados.
5. Proveedor externo (Gemini) caído (mock 500/timeout) → siguen llegando recetas internas.
6. Receta interna y externa equivalentes → aparece una sola vez tras dedup.
7. Orden: receta externa con mejor match supera a interna con peor match.

## Consideraciones técnicas

- Score simple y explicable para el MVP: sin pesos complejos, sustituciones ni NLP (#15).
- Staples vienen del catálogo (`is_pantry_staple`), no de suposiciones por usuario (#16).
- `cuisine` jamás es obligatoria en `FindRecipesFromPantry` (#17, #88).
- El orden equilibra `relevance + matchScore + user filters + source quality` (#86), no `Internal > Proveedor externo (Gemini)` automático.
- Diseñar la firma para recibir `UserPreferences` en el futuro sin implementarlo (#87).

## Decisiones de implementación

- `recipe_ingredients.optional` se conserva en base de datos mediante `003_recipe_ingredient_optionality.sql`, como `BOOLEAN NOT NULL DEFAULT FALSE`. El default mantiene como obligatorias las relaciones creadas antes de esta migración.
- El score divide los ingredientes obligatorios disponibles entre los obligatorios no-staple. Los pantry staples faltantes siguen apareciendo en `missingIngredients`, pero no reducen el score; los opcionales faltantes se reportan aparte y tampoco lo reducen.
- Se considera suficiente el catálogo interno cuando al menos una receta alcanza `matchScore >= 0.8` (4/5 obligatorios disponibles); de lo contrario, se consulta Gemini y luego se combinan, deduplican y ordenan ambas fuentes.
- La consulta interna carga receta, relación e ingrediente asociado en una sola lectura. El proveedor Gemini conserva nombre y opcionalidad de ingredientes generados para que el mismo motor pueda evaluarlos sin alterar el flujo de persistencia estable de recetas.
- No hay campos actuales para evaluar calidad/confiabilidad ni restricciones dietarias de una receta; el ordenamiento usa score, cantidad disponible y fuente como desempate. `UserPreferences` sigue siendo diseño futuro según spec 07, por lo que las preferencias y restricciones no se aplican en esta versión.

## Criterios de aceptación

- [x] Los 7 casos de prueba en verde (unit, mocks para externo).
- [x] Resultados con la forma exacta de #71.
- [x] Fallback ante fallo del proveedor externo (Gemini) demostrado con mock.
- [x] Dedup y ordenamiento cubiertos por tests.
- [x] Documentado el algoritmo y el criterio de fallback en esta issue.

## Resultado esperado

Motor de recomendación funcional y explicable: ingredientes → score → recetas multicocina ordenadas por relevancia, resiliente al fallo del proveedor externo y preparado para evolucionar (sustituciones, preferencias, IA).

## Evidencia de implementación (2026-10-09)

- Se agregó la migración `supabase/migrations/003_recipe_ingredient_optionality.sql`, que añade `optional BOOLEAN NOT NULL DEFAULT FALSE`. No se aplicó a una base remota ni se ejecutó `db:push`.
- `src/types/database.types.ts` refleja la columna nueva. La regeneración mediante `supabase gen types --local` no estaba disponible porque no existe contenedor Supabase local; se evitó `--linked` para no contactar la base remota.
- `createSupabaseRecipeRecommendationCatalog` carga recetas internas con relaciones e ingredientes asociados; la clasificación pantry-staple viene del catálogo y la opcionalidad de la nueva columna.
- `createRecipeRecommendationService` usa disponibles/obligatorios no-staple como score; staples ausentes permanecen en faltantes, sin reducir score. Una receta sin relaciones de ingredientes recibe score 0.
- Se consulta Gemini cuando ninguna receta interna alcanza `0.8`; un error externo deja intactos los resultados internos. Los candidatos se deduplican por nombre normalizado y se ordenan por score, cantidad de ingredientes disponibles y, solo como desempate, fuente interna.
- Los filtros de comida, cocina, tiempo y dificultad se aplican al catálogo; los candidatos externos se validan contra tiempo y dificultad después de generar. Las preferencias dietarias no se aplican todavía porque el modelo no las representa.
- Verificación final: `pnpm lint` PASS; `pnpm typecheck` PASS; `pnpm test` PASS (25 archivos, 176 tests). Vitest emitió solo su aviso existente sobre `__dirname` en `vitest.config.mts` y `configLoader: 'native'`.
