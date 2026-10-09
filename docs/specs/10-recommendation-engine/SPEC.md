# SPEC: 10 — Motor de recomendaciones y algoritmo de matching

**Fuente:** PROMTP.md #2 (Principio central), #14 (Servicio de recomendación), #15 (Algoritmo de matching), #16 (Pantry staples), #17 (Filtro de cocina), #31 (Estrategia de recomendaciones), #33 (Deduplicación), #71 (Forma del resultado), #86 (Prioridad de fuente), #88 (Input del endpoint de recomendaciones).

## Propósito

Construir `RecipeRecommendationService`: el pipeline ingredientes→recomendaciones con un match score simple y explicable, fuentes priorizando lo interno, complemento con el proveedor externo (Gemini), deduplicación y ordenamiento por relevancia.

## Alcance

### Dentro del alcance
- Servicio de recomendaciones (contrato de entrada/salida).
- Algoritmo de matching (MVP simple, extensible).
- Regla de pantry staples y filtro de cocina opcional.
- Estrategia end-to-end: normalizar → interno → (si es insuficiente) externo → mapear → match → merge → dedup → ordenar.
- Forma del DTO de resultado.

### Fuera del alcance
- Endpoint HTTP (spec 11), renderizado del score en UI (spec 14), primitivas de normalización (spec 06), internals del provider (spec 09).

## Requisitos

| ID | Requisito |
|----|-----------|
| REQ-01 | Servicio `RecipeRecommendationService`. Entrada: `availableIngredients`, `mealType?`, `cuisine?`, `maxPreparationTime?`, `difficulty?`, `dietaryPreferences?`. Salida por resultado: `recipe`, `matchScore`, `availableIngredients`, `missingIngredients`, `optionalMissingIngredients`. |
| REQ-02 | Score base = `ingredientes obligatorios disponibles / total de obligatorios` (p. ej. 4/5 = 80%). `matchScore` es un valor 0–1 (`RecipeMatchScore`). |
| REQ-03 | El algoritmo debe ser simple y explicable para el MVP, permaneciendo extensible hacia: ingredientes opcionales, pantry staples, cantidades, sustituciones, relevancia del ingrediente, preferencias, restricciones dietarias. **Sin algoritmo excesivamente complejo ahora.** |
| REQ-04 | Los pantry staples (`isPantryStaple = true`: sal, pimienta, aceite, azúcar, agua) **no** deben penalizar fuertemente el score; la clasificación viene del catálogo, nunca se asume uniforme para todos los usuarios. |
| REQ-05 | El filtro de cocina es opcional con default `ALL`; cuando se define (p. ej. `Peruvian`), los resultados se filtran/priorizan para esa cocina. `FindRecipesFromPantry` nunca trata la cocina como obligatoria. |
| REQ-06 | Flujo de estrategia: ingredientes del usuario → normalización → catálogo interno → matching → resultados internos → si son insuficientes → proveedor externo (Gemini) → validación + mapeo → matching → merge → dedup → ordenamiento → resultados. Las recetas internas se priorizan **cuando son buenas coincidencias**; el proveedor externo es complementario y nunca un single point of failure. |
| REQ-07 | Deduplicación entre versiones interna y externa de una misma receta usando heurísticas simples para el MVP: nombre normalizado, source, external id, slug. La arquitectura debe permitir mejorar el algoritmo después. Sin algoritmo complejo ahora. |
| REQ-08 | Prioridad de ordenamiento: (1) calidad del match, (2) disponibilidad de ingredientes, (3) preferencias del usuario, (4) calidad/confiabilidad de la receta, (5) fuente. **No** ordenar simplemente `Internal > Proveedor externo (Gemini)` cuando una receta externa coincide mucho mejor — equilibrar `relevance + matchScore + user filters + source quality`. |
| REQ-09 | Forma del resultado expuesta a consumidores (API/UI) según PROMTP #71, incluyendo el ejemplo `matchScore: 0.92` con arrays `availableIngredients`/`missingIngredients`/`optionalMissingIngredients`. |
| REQ-10 | Input de recomendación desde clientes: `{ ingredientIds, mealType, cuisineId }` (el transporte se ve en la spec 11). |

## Dependencias

- `06-domain-layer`, `07-application-layer`, `09-gemini-adapter` (ruta de fallback), `08-infrastructure-supabase` (recetas internas).

## Criterios de aceptación

- [ ] Score de 4/5 ingredientes obligatorios = 0.8 en tests unitarios (REQ-02).
- [ ] Faltar un staple (sal) no hace caer el score como faltar un ingrediente principal (REQ-04).
- [ ] Sin cuisine especificada → resultados que abarcan múltiples cocinas (Casos 2/3 de PROMTP #83).
- [ ] Con el proveedor externo (Gemini) fallando → los resultados internos siguen llegando (Caso 5).
- [ ] La misma receta desde interna + proveedor externo (Gemini) aparece una sola vez tras dedup.
- [ ] Test de ordenamiento: una receta externa con mejor match puede rankear por encima de una interna más débil.

## Verificación

Tests unitarios de dominio/aplicación para scoring, staples, opcionalidad de cuisine, dedup y ordenamiento (spec 16).
