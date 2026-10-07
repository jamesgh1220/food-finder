# SPEC: 13 — Frontend: Dashboard y Pantry

**Fuente:** PROMTP.md #40 (Dashboard), #41 (Pantry), #45 (Componentes de pantry), #83 Casos 2–3 (flujos de aceptación), #70 (Modelo de filtros — parte de inputs de pantry).

## Propósito

Construir el inicio autenticado (`/dashboard`) y el gestor de despensa (`/dashboard/pantry`): la pantalla donde el usuario declara sus ingredientes y lanza las búsquedas de recetas.

## Alcance

### Dentro del alcance
- Página de dashboard: saludo, selector de tipo de comida, ingredientes disponibles, selector opcional de cocina, botón de búsqueda, recomendaciones.
- Página de pantry: buscar/agregar/editar/eliminar ingredientes con cantidad/unidad, limpiar despensa.

### Fuera del alcance
- Páginas de recetas/detalle/favoritos (spec 14), algoritmo de recomendación (spec 10), componentes compartidos (spec 12), rutas API (spec 11).

## Requisitos

| ID | Requisito |
|----|-----------|
| REQ-01 | Ruta de dashboard `/dashboard` (protegida — redirect según spec 05) con: saludo, selector de tipo de comida (`Desayuno/Almuerzo/Cena/Cualquier momento`), chips de ingredientes disponibles, selector opcional de cocina (default `Todas`), botón **Encontrar recetas** y resultados de recomendación. |
| REQ-02 | Ruta de pantry `/dashboard/pantry` con componentes `IngredientSearch`, `IngredientSelector`, `PantryList`, `PantryItem`. |
| REQ-03 | Operaciones de pantry: buscar ingrediente (case-insensitive), agregar, editar (cantidad/unidad), eliminar, limpiar despensa. |
| REQ-04 | La búsqueda envía `{ ingredientIds, mealType, cuisineId }` al flujo de recomendaciones (endpoint de la spec 11 o caso de uso directo según la regla de hops de la spec 02). |
| REQ-05 | La lista de resultados renderiza `RecipeCard`s compartidos con `RecipeMatchScore` y pistas de ingredientes faltantes (componentes de la spec 12). |
| REQ-06 | El modelo de filtros debe ser extensible: modelo completo `ingredients, mealType, cuisine, maxPreparationTime, difficulty, diet`; el MVP implementa solo `ingredients, mealType, cuisine` sin bloquear la forma (#70). |
| REQ-07 | **Nota de rutas:** las URLs especificadas (`/dashboard`, `/dashboard/pantry`) son autoritativas. Los route groups de Next.js no afectan la URL — estructurar las carpetas para que las URLs finales coincidan exactamente (adaptar el layout de carpetas de PROMTP #9 si es necesario). |
| REQ-08 | Despensa vacía → `EmptyState` amigable que guíe al usuario a agregar ingredientes; estados de carga y error en todas las obtenciones de datos. |

## Dependencias

- `12-frontend-foundation`, `07-application-layer`, `10-recommendation-engine` (resultados), `05-supabase-auth` (protección).

## Criterios de aceptación

- [ ] `/dashboard` exige autenticación y muestra todos los elementos de REQ-01.
- [ ] El CRUD de pantry funciona end-to-end contra datos reales (agregar `papa`, `carne`, `huevo` → visibles en la lista; editar/eliminar/limpiar funcionan).
- [ ] Seleccionando tipo de comida, sin cocina, y buscando → resultados multi-cocina (Caso 2).
- [ ] Con `cuisine = Peruana` → resultados predominantemente/solo peruanos (Caso 3).
- [ ] Las URLs finales son exactamente `/dashboard` y `/dashboard/pantry`.

## Verificación

Flujos E2E 3–6 de la spec 16 (dashboard, agregar ingredientes, seleccionar meal type, buscar recetas, ver resultados).
