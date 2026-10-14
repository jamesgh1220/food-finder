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

- [x] Ambas rutas en producción con los elementos completos de PROMTP #40/#41. *(construidas con todos los elementos y `pnpm build` PASS; **no desplegadas a producción** ni con pase visual manual)*
- [ ] CRUD de pantry end-to-end persistiendo en Supabase. *(**parcial**: implementado y verificado con casos de uso mockeados; el E2E 3–4 de la spec 16 no se ejecutó)*
- [ ] Casos 2 y 3 del PROMPT verificados en navegador. *(**pendiente**: E2E 5–6 de la spec 16. El bloqueo de datos ya no aplica: el catálogo real quedó sembrado el 2026-10-14 con 29 recetas de 6 cocinas)*
- [x] URLs exactas `/dashboard` y `/dashboard/pantry`.
- [x] Estados loading/empty/error presentes. *(`EmptyState`/`LoadingState`/`ErrorState` + treats de estado en `tests/unit/components/dashboard-page.test.tsx`)*

## Resultado esperado

El corazón usable del MVP: el usuario administra su despensa y obtiene recomendaciones explicables desde una sola pantalla, lista para conectar con la galería de recetas (spec 14).

## Evidencia de implementación (implementado 2026-10-13 · registrado 2026-10-13)

**Estado:** implementada y verificada a nivel unit/estructural; **aceptación E2E pendiente** (spec 16).

**Commits de work-unit** en `feat/13-dashboard-pantry`: `be02bbd` (shell compartido, página de dashboard y filtros) · `d598068` · `2746408` (correcciones de la revisión) · `21514e9` (tests de controles, estados de página y frontera client/server).

- **Rutas:** `/dashboard` (`src/app/dashboard/page.tsx`) y `/dashboard/pantry` (`src/app/dashboard/pantry/page.tsx`); `pnpm build` las reporta como `◐` Partial Prerender (shell estático + contenido dinámico en streaming).
- **Dashboard:** saludo, `MealTypeSelector`, chips de pantry, `CuisineSelector` opcional y botón `Encontrar recetas`; el envío mueve a `/dashboard/recipes` (decisión registrada en la spec 14).
- **Pantry:** `IngredientSearch`, `IngredientSelector`, `PantryList` y `PantryItem` con edición de cantidad/unidad, borrado y limpieza. El alta ocurre al seleccionar un resultado de búsqueda (no hay botón "Agregar" separado): `handleSelectIngredient` → `addPantryIngredientAction` con cantidad 1 y unidad por defecto.
- **Protección:** `/dashboard` y `/dashboard/pantry` exigen sesión; con sesión expirada en plena carga redirigen a `/login`.
- **Verificación observada (2026-10-13):** `pnpm lint` PASS · `pnpm typecheck` PASS · `pnpm test` PASS — 44 archivos / 271 tests · `pnpm build` PASS.
- **Revisión independiente:** VERIFIED WITH FINDINGS — 0 blocker, 0 major, 4 minor, 4 nit; 3 corregidos en `2746408`, el resto aceptado/documentado en `odd/tasks/13-dashboard-pantry.md`.
- **Pendiente honesto:** los flujos E2E 3–6 de la spec 16 no se ejecutaron. El bloqueo de datos que impedía los casos 2 y 3 quedó resuelto el 2026-10-14 (`recipes` = 29, `recipe_ingredients` = 229); falta correr el E2E.
- **Desviación de proceso:** el registro se volcó solo a `odd/tasks/13-dashboard-pantry.md`; se corrige con esta nota.
