# ISSUE: 13 — Frontend: Dashboard y Pantry

## Título

Construir el dashboard y la gestión de despensa (pantry) con búsqueda de ingredientes y lanzamiento de recomendaciones

## Descripción

El dashboard es el centro del producto: saludo, selector de tipo de comida, ingredientes disponibles, selector opcional de cocina y botón de búsqueda que muestra recomendaciones. La despensa (`/dashboard/pantry`) gestiona los ingredientes: buscar, agregar, editar cantidad/unidad, eliminar y limpiar.

## Objetivo

El usuario puede declarar qué tiene en su cocina y obtener recomendaciones multicocina en un flujo único, móvil primero, con estados vacíos/carga/error cuidados.

## Alcance

- Ruta `/dashboard` protegida con todos los elementos de PROMTP #40.
- Ruta `/dashboard/pantry` con `IngredientSearch`, `IngredientSelector`, `PantryList`, `PantryItem` (#41).
- Operaciones: búsqueda case-insensitive, agregar, editar, eliminar, limpiar despensa.
- Envío de `{ingredientIds, mealType, cuisineId}` al flujo de recomendaciones.
- Render de resultados con `RecipeCard` + `RecipeMatchScore` (componentes spec 12).
- Modelo de filtros extensible, MVP con `ingredients/mealType/cuisine` (#70).
- URLs finales exactas: `/dashboard`, `/dashboard/pantry` (los route groups de Next no alteran la URL — adaptar carpetas).

**Fuera de alcance:** páginas de recetas/detalle/favoritos (spec 14), algoritmo (spec 10), componentes compartidos (spec 12), endpoints (spec 11).

## Casos de prueba

1. Usuario no autenticado en `/dashboard` → redirect `/login`.
2. Agregar `papa`, `carne`, `huevo` → aparecen en `PantryList`.
3. Editar cantidad/unidad de un ítem → persiste tras recargar.
4. Eliminar un ítem y `ClearUserPantry` → lista vacía.
5. Búsqueda de `TOMATE` encuentra el ingrediente `Tomate`.
6. Seleccionar `Almuerzo`, sin cocina, buscar → resultados de múltiples gastronomías (Caso 2).
7. Seleccionar cocina `Peruana` → resultados peruanos (Caso 3).
8. Despensa vacía → `EmptyState` amigable, no pantalla rota.

## Consideraciones técnicas

- Respetar la regla de hops (spec 02): si es Server Component, invocar casos de uso directamente; el endpoint `/api` es para clientes externos.
- Los ingredientes del usuario provienen de su sesión — nunca de estado global compartido entre usuarios.
- El modelo de filtros debe poder crecer (maxPreparationTime, difficulty, diet) sin rehacer el estado (#70).
- Copy localizable, mobile-first, chips tocables (#46).

## Criterios de aceptación

- [ ] Ambas rutas en producción con los elementos completos de PROMTP #40/#41.
- [ ] CRUD de pantry end-to-end persistiendo en Supabase.
- [ ] Casos 2 y 3 del PROMPT verificados en navegador.
- [ ] URLs exactas `/dashboard` y `/dashboard/pantry`.
- [ ] Estados loading/empty/error presentes.

## Resultado esperado

El corazón usable del MVP: el usuario administra su despensa y obtiene recomendaciones explicables desde una sola pantalla, lista para conectar con la galería de recetas (spec 14).
