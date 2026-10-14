# SPEC: 14 — Frontend: Recetas, detalle y favoritos

**Fuente:** PROMTP.md #42 (Recetas), #43 (Detalle de receta), #44 (Favoritos), #45 (Componentes de receta), #70 (Modelo de filtros), #71 (Resultados de búsqueda), #72 (UI de match score), #83 Casos 4/6 (aceptación).

## Propósito

Construir las superficies de descubrimiento de recetas: cuadrícula de resultados con filtros y explicación de coincidencia, la página completa de detalle de receta y la lista de favoritos.

## Alcance

### Dentro del alcance
- `/dashboard/recipes` con filtros (cocina, tipo de comida) y tarjetas de resultado.
- Vista de detalle `/dashboard/recipes/[id]`.
- Lista `/dashboard/favorites` con eliminación/búsqueda.
- UI de match score que explica *por qué* se recomendó una receta.

### Fuera del alcance
- Motor de recomendaciones (spec 10), componentes compartidos (spec 12), API de favoritos (spec 11).

## Requisitos

| ID | Requisito |
|----|-----------|
| REQ-01 | `/dashboard/recipes`: filtros (cocina, tipo de comida), cuadrícula `RecipeCard`, por tarjeta: match score, ingredientes disponibles, ingredientes faltantes. Componentes: `MealTypeSelector`, `CuisineSelector`, `RecipeCard`, `RecipeGrid`, `RecipeMatchScore`, `MissingIngredients`. |
| REQ-02 | `/dashboard/recipes/[id]`: nombre, imagen, descripción, cocina, país, región, ingredientes con cantidades, instrucciones, tiempo, porciones, dificultad, match score, ingredientes disponibles/faltantes, botón de favorito, fuente. |
| REQ-03 | `/dashboard/favorites`: lista de recetas favoritas, búsqueda/filtros cuando aporten, eliminación de favorito. |
| REQ-04 | Cada resultado expone `recipe, matchScore, availableIngredients, missingIngredients, optionalMissingIngredients` (#71) — forma JSON de ejemplo del PROMPT. |
| REQ-05 | La UI del match score debe ser **comprensible**: "92% de coincidencia" o "Tienes 5 de 6 ingredientes" — nunca solo un número abstracto; el usuario debe entender *por qué* se recomendó la receta (#72). |
| REQ-06 | Modelo de filtros extensible (`maxPreparationTime`, `difficulty`, `diet` reservados); el MVP entrega solo `ingredients/mealType/cuisine` (#70). |
| REQ-07 | Caso de ingredientes insuficientes (Caso 4): mostrar disponibles **y** faltantes con claridad en tarjetas y detalle. |
| REQ-08 | El botón de favorito alterna estado optimista/persistente vía los casos de uso de favoritos; Caso 6: el favorito persiste en Supabase entre sesiones. |
| REQ-09 | El detalle de receta debe manejar de forma transparente recetas internas y recetas generadas por IA (mostrar `source`; los estados de fallo externo degradan con elegancia según la spec 09). |
| REQ-10 | Skeletons de carga, estados vacíos (sin resultados, sin favoritos), estados de error en todas partes. |

## Dependencias

- `12-frontend-foundation`, `13-frontend-dashboard-pantry` (entrada de búsqueda), `11-api-layer`, `10-recommendation-engine`.

## Criterios de aceptación

- [x] Buscar desde el dashboard lleva a/renderiza resultados en `/dashboard/recipes` con filtros funcionando. *(navegación + render + filtros cubiertos por `tests/unit/components/recipes-page.test.tsx` y `recipes-filters.test.tsx` con fixtures)*
- [x] Las tarjetas muestran porcentaje + ingredientes disponibles/faltantes (Caso 4).
- [x] La página de detalle renderiza cada campo de REQ-02 para una receta interna y una externa. *(`tests/unit/components/recipe-detail-page.test.tsx`; REQ-09 cubierto: se muestra `source` y una receta ausente del match omite el bloque de score)*
- [ ] Favorito → persiste (Caso 6); quitar favorito lo elimina; `/dashboard/favorites` refleja el estado. *(**parcial**: acciones y lista cubiertas con casos de uso mockeados; la persistencia real entre sesiones no se verificó)*
- [x] Match score comprensible en al menos los dos formatos de REQ-05.

## Verificación

Flujos E2E 7–10 de la spec 16 (ver resultados, ver receta, guardar favorito, consultar favoritos) + tests RTL de `RecipeMatchScore`.

**Evidencia observada (2026-10-13):** `pnpm lint` PASS · `pnpm typecheck` PASS · `pnpm test` PASS — 49 archivos / 310 tests · `pnpm build` PASS (las 3 rutas se generan). Detalle completo en el registro del `ISSUE.md`.

## Implementación (resultado) — 2026-10-13

**Estado:** completada a nivel unit/estructural; aceptación E2E pendiente.

- **Resultados:** `/dashboard/recipes` con filtros de cocina y tipo de comida, `RecipeGrid` y `RecipeCard` con score explicado.
- **Detalle:** `/dashboard/recipes/[id]` con los campos de REQ-02; una receta no encontrada se resuelve en página con `EmptyState`.
- **Match score (REQ-05):** el detalle usa el formato porcentual y la tarjeta el de ingredientes; ambos formatos quedan cubiertos.
- **REQ-09:** el bloque de score del detalle reutiliza `FindRecipesFromPantry` con los ids del pantry (sin meal type ni cocina), evitando filtrar la receta fuera de sus propios resultados y evitando una llamada externa a Gemini; si la receta no aparece en el match, el bloque se omite.
- **Favoritos:** `FavoriteToggle` (nombre accesible `"Guardar en favoritos: <receta>"`) + `/dashboard/favorites` con eliminación.
- **Read path:** `RecipeIngredientDetail`, `RecipeRepository.findIngredients` y `GetRecipeIngredients`.
- **Pendiente honesto:** E2E 7–10 (spec 16) y la persistencia real de favoritos entre sesiones. El catálogo real ya está sembrado (2026-10-14), así que el E2E es ejecutable.
