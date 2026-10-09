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

- [ ] Las tres rutas funcionales y responsivas.
- [ ] Score explicado en los dos formatos admitidos, verificado en tarjeta y detalle.
- [ ] Casos 4 y 6 del PROMPT verificados end-to-end.
- [ ] Filtros de cocina y meal type funcionando sobre resultados reales.
- [ ] Estados vacío/carga/error presentes en las tres vistas.

## Resultado esperado

Experiencia de descubrimiento completa: el usuario filtra, entiende cada recomendación, ve el detalle de la receta y guarda favoritos persistentes — cerrando el ciclo MVP "ingredientes → recomendaciones → descubrimiento".
