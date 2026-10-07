# ISSUE: 10 — Motor de recomendaciones y algoritmo de matching

## Título

Implementar RecipeRecommendationService: algoritmo de matching, staples, filtro de cocina opcional, merge y deduplicación

## Descripción

El núcleo del producto es "ingredientes → posibilidades culinarias". Esta spec construye el servicio de recomendación: score base explicable (disponibles/obligatorios), regla de pantry staples, filtro de cocina opcional (default ALL), flujo interno-primero con complemento de Spoonacular, deduplicación simple y ordenamiento por relevancia — nunca por fuente de forma ciega.

## Objetivo

Recomendaciones correctas, explicables y multicocina: el usuario ve qué puede cocinar con lo que tiene, con porcentaje de coincidencia, ingredientes disponibles y faltantes, sin que Spoonacular sea punto único de fallo.

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
5. Spoonacular caído (mock 500/timeout) → siguen llegando recetas internas.
6. Receta interna y externa equivalentes → aparece una sola vez tras dedup.
7. Orden: receta externa con mejor match supera a interna con peor match.

## Consideraciones técnicas

- Score simple y explicable para el MVP: sin pesos complejos, sustituciones ni NLP (#15).
- Staples vienen del catálogo (`is_pantry_staple`), no de suposiciones por usuario (#16).
- `cuisine` jamás es obligatoria en `FindRecipesFromPantry` (#17, #88).
- El orden equilibra `relevance + matchScore + user filters + source quality` (#86), no `Internal > Spoonacular` automático.
- Diseñar la firma para recibir `UserPreferences` en el futuro sin implementarlo (#87).

## Criterios de aceptación

- [ ] Los 7 casos de prueba en verde (unit, mocks para externo).
- [ ] Resultados con la forma exacta de #71.
- [ ] Fallback ante fallo de Spoonacular demostrado con mock.
- [ ] Dedup y ordenamiento cubiertos por tests.
- [ ] Documentado el algoritmo (para spec 17: docs/decisions).

## Resultado esperado

Motor de recomendación funcional y explicable: ingredientes → score → recetas multicocina ordenadas por relevancia, resiliente al fallo del proveedor externo y preparado para evolucionar (sustituciones, preferencias, IA).
