# ISSUE: 14 — Frontend: Recipes, Detail & Favorites

## Título

Construir la galería de recetas con filtros y score explicable, la página de detalle y los favoritos

## Descripción

Las pantallas de descubrimiento: lista de recetas con filtros (cocina, tipo de comida) y tarjetas que muestran coincidencia + ingredientes disponibles/faltantes; detalle completo de receta con todos los campos; y favoritos con persistencia en Supabase.

## Objetivo

El usuario entiende **por qué** se le recomendó cada receta (score explicado, no número abstracto), puede inspeccionar el detalle completo y guardar lo que le gusta para volver a ello.

## Alcance

- `/dashboard/recipes` con `MealTypeSelector`, `CuisineSelector`, `RecipeCard`, `RecipeGrid`, `RecipeMatchScore`, `MissingIngredients` (#42).
- `/dashboard/recipes/[id]` con los 15+ campos del PROMPT #43.
- `/dashboard/favorites` con lista, búsqueda útil y eliminación (#44).
- Forma de resultado `recipe, matchScore, availableIngredients, missingIngredients, optionalMissingIngredients` (#71).
- UI de score comprensible: "92% de coincidencia" / "Tienes 5 de 6 ingredientes" (#72).
- Modelo de filtros extensible con MVP limitado a `ingredients/mealType/cuisine` (#70).

**Fuera de alcance:** motor de recomendación, componentes compartidos, endpoints de favorites.

## Casos de prueba

1. Desde dashboard con `papa, carne, huevo` + `Almuerzo` → grid de resultados con scores.
2. Cada tarjeta muestra % de coincidencia + ✓ disponibles + ⚠ faltantes (Caso 4).
3. Filtro `Peruana` en la página de recetas → solo/principalmente peruanas.
4. Click en tarjeta → detalle con nombre, imagen, ingredientes con cantidades, instrucciones, tiempo, porciones, dificultad, fuente, score.
5. Botón favorito → guarda; recargar/favoritos → persiste (Caso 6).
6. Eliminar favorito → desaparece de `/dashboard/favorites`.
7. Sin resultados → `EmptyState`; cargando → skeleton; error → `ErrorState`.
8. Receta externa (generada por Gemini) renderiza igual que interna, mostrando `source`.

## Consideraciones técnicas

- El score SIEMPRE acompaña a su explicación (#72): nunca solo un número suelto.
- Las recetas externas pueden perder campos o fallar: degradar con elegancia (spec 09), jamás mostrar errores técnicos.
- Mantener el modelo de filtros preparado para `maxPreparationTime/difficulty/diet` sin implementarlos (#70).
- Mobile-first: tarjetas apilables, detalle legible en pantalla chica.

## Criterios de aceptación

- [x] Las tres rutas funcionales y responsivas. *(`/dashboard/recipes`, `/dashboard/recipes/[id]`, `/dashboard/favorites`; `pnpm build` PASS)*
- [x] Score explicado en los dos formatos admitidos, verificado en tarjeta y detalle. *(tarjeta: "Tienes 5 de 6 ingredientes"; detalle: "92% de coincidencia" — cubierto por `tests/unit/components/recipe-match-score.test.tsx`)*
- [ ] Casos 4 y 6 del PROMPT verificados end-to-end. *(**pendiente**: E2E 7–10 de la spec 16 no ejecutados)*
- [x] Filtros de cocina y meal type funcionando sobre resultados reales. *(filtros cableados a la URL y cubiertos por `tests/unit/components/recipes-filters.test.tsx`; el tramo "resultados reales" depende del catálogo sembrado y del E2E de la spec 16)*
- [x] Estados vacío/carga/error presentes en las tres vistas.

## Resultado esperado

Experiencia de descubrimiento completa: el usuario filtra, entiende cada recomendación, ve el detalle de la receta y guarda favoritos persistentes — cerrando el ciclo MVP "ingredientes → recomendaciones → descubrimiento".

## Evidencia de implementación (implementado 2026-10-13 · registrado 2026-10-13)

**Estado:** implementada y verificada a nivel unit/estructural; **aceptación E2E pendiente** (spec 16).

**Commits de work-unit** en `feat/14-recipes-favorites`: `5948bd0` (read path de ingredientes de receta) · `871655b` (mueve los resultados de recetas a `/dashboard/recipes`) · `40976f3` (acciones, toggle y lista de favoritos) · `ad6b22d` (página de resultados y filtros) · `55b0557` (página de detalle) · `89839e1` (auditoría de frontera client/server) · `e81995b` (registro).

- **Resultados:** `/dashboard/recipes` con `MealTypeSelector`, `CuisineSelector`, `RecipeGrid` y `RecipeCard`; cada tarjeta explica la coincidencia con ingredientes disponibles y faltantes.
- **Detalle:** `/dashboard/recipes/[id]` renderiza los campos de REQ-02 (nombre, imagen, ingredientes con cantidades, instrucciones, tiempo, porciones, dificultad, fuente y score). Una receta inexistente se resuelve con `EmptyState` en la página (no con `notFound()`).
- **Score explicable (REQ-05):** el detalle usa el formato porcentual y la tarjeta el de ingredientes, de modo que ambos formatos requeridos quedan cubiertos y visibles.
- **Favoritos:** `FavoriteToggle`/`FavoritesList` + `addFavoriteAction`/`removeFavoriteAction` sobre los casos de uso de favoritos; `/dashboard/favorites` lista y permite eliminar.
- **Read path nuevo:** `RecipeIngredientDetail`, `RecipeRepository.findIngredients` y el caso de uso `GetRecipeIngredients`, con wiring en `createApplicationServices`.
- **Verificación observada (2026-10-13):** `pnpm lint` PASS · `pnpm typecheck` PASS · `pnpm test` PASS — 49 archivos / 310 tests · `pnpm build` PASS (las 3 rutas se generan).
- **Pendiente honesto:** los flujos E2E 7–10 de la spec 16 no se ejecutaron; la persistencia de favoritos entre sesiones y la renderización con datos reales ya no tienen bloqueo de datos (el catálogo se sembró el 2026-10-14), pero el E2E sigue pendiente.
- **Desviación de proceso:** el registro se volcó solo a `odd/tasks/14-recipes-favorites.md`; se corrige con esta nota.
