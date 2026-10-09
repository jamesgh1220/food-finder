# ISSUE: 07 — Capa de aplicación

## Título

Implementar los 16 casos de uso de la capa application con DTOs, autorización y puertos de extensión futura

## Descripción

La capa application coordina todo: 16 casos de uso mínimos (auth, pantry, recipes, cuisine, favorites), sus DTOs, la autorización a nivel de caso de uso y los puntos de extensión futuros (IA y preferencias de usuario) que deben quedar **diseñados pero no implementados**. Es el contrato que conecta la UI/API con el dominio.

## Objetivo

Todos los flujos del MVP expresados como casos de uso testeables, con autorización propia y dependencia solo de puertos, listos para ser consumidos por Route Handlers y Server Components.

## Alcance

- Casos de uso según PROMTP #13 (4 auth, 5 pantry, 4 recipes, 2 cuisine, 3 favorites = 18; ver nota de conteo más abajo).
- DTOs de entrada/salida y orquestación de repositorios/servicios.
- Autorización dentro del caso de uso (datos de usuario verificados en servidor).
- Regla: `cuisine` opcional en `FindRecipesFromPantry` (default ALL).
- Extension points documentados: `RecipeRecommendationEnhancer` (futuro IA) y forma de `UserPreferences` futura.

**Fuera de alcance:** internals del motor de recomendación (spec 10), exposición HTTP (spec 11), adapters concretos (spec 08).

## Casos de prueba

1. Cada caso de uso pasa tests unitarios con repositorios mockeados.
2. `AddPantryIngredient` asocia la fila al usuario autenticado — nunca a otro userId.
3. `FindRecipesFromPantry` sin cuisine devuelve recetas de múltiples gastronomías.
4. `GetUserPantry`/`GetFavoriteRecipes` solo retornan datos del usuario de la sesión.
5. `ClearUserPantry` elimina solo filas del usuario.
6. Los stubs de IA/preferencias compilan pero no ejecutan lógica.

## Consideraciones técnicas

- La autorización a nivel de caso de uso es defensa en profundidad junto con RLS (spec 04), no su reemplazo.
- No implementar IA (PROMTP #73) ni preferencias completas (PROMTP #87): solo interfaces/documentación.
- Mantener casos de uso pequeños y con nombres de acción claros; sin frameworks de caso de uso.

## Criterios de aceptación

- [x] Los casos de uso existen y están cableados en el composition root. *(18 en total: 4 auth de la spec 05 reutilizados vía `createAuthServices` + 14 nuevos; `createApplicationServices` en `src/lib/composition/application.ts`. Cubierto por `tests/unit/application/composition.test.ts`)*
- [x] Suite unitaria de aplicación verde con mocks (sin BD real). *(`tests/unit/application/*` con puertos mockeados; 6 archivos de test nuevos + helpers. `pnpm test` → 18 archivos / 85 tests PASS)*
- [x] Verificación de pertenencia de usuario en todo caso de uso con datos de usuario. *(el `userId` sale SIEMPRE de `AuthPort.getCurrentUser()` vía `requireAuthenticatedUser`; sin sesión → `UnauthorizedError` sin tocar el repositorio. Cubierto en pantry/favorites/recipes)*
- [x] Cuisine opcional demostrado con test. *(`FindRecipesFromPantry` con `cuisineId` null/undefined no envía filtro → resultado multi-cocina; `tests/unit/application/recipes-use-cases.test.ts`)*
- [x] Extension points futuros documentados e inertes. *(`RecipeRecommendationEnhancer` + `UserPreferences` como interfaces sin clase/función; `tests/unit/application/extension-points.test.ts` audita la ausencia de implementación)*

### Nota de conteo (16 vs 18)

El título de la spec dice "16 casos de uso", pero la enumeración autoritativa de PROMTP #13 suma **18** (4 + 5 + 4 + 2 + 3). Los 4 de auth ya existían desde la spec 05; esta spec implementa los **14 nuevos** y deja los 18 cableados. La discrepancia es del texto de la spec, no del alcance.

## Registro de implementación

**Estado:** completado (2026-10-09, rama `feat/07-application-layer`)

**Qué se hizo:**
- Puertos nuevos de aplicación: `src/application/ports/recipe-recommendation.ts` (contrato que implementará la spec 10), `recipe-recommendation-enhancer.ts` (extensión IA futura, solo diseño) y `user-preferences.ts` (forma futura PROMTP #87, solo diseño).
- Autorización a nivel de caso de uso: helper `src/application/shared/require-authenticated-user.ts` (userId desde la sesión de servidor; sin sesión → `UnauthorizedError`).
- 14 casos de uso nuevos: Pantry (`add/update/remove-pantry-ingredient`, `get-user-pantry`, `clear-user-pantry`), Recipes (`find-recipes-from-pantry`, `get-recipe-by-id`, `search-recipes`, `get-recipes-by-meal-type`), Cuisine (`get-cuisines`, `get-cuisine-by-id`) y Favorites (`add/remove-favorite-recipe`, `get-favorite-recipes`) + barrel `src/application/index.ts`.
- Errores de dominio para fallos esperados (`UnauthorizedError`, `NotFoundError`, `ConflictError`, `ValidationError`); el mapeo HTTP queda para la spec 11.
- Composition root `src/lib/composition/application.ts`: `createApplicationServices(deps)` cablea los 18 casos de uso desde puertos inyectados (sin importar infraestructura).
- Regla ESLint de pureza para `src/application/**` (espejo de la del dominio) + test de auditoría de imports `tests/unit/application/application-purity.test.ts`.
- Tests: `tests/unit/application/{pantry,recipes,cuisine,favorites}-use-cases.test.ts`, `extension-points.test.ts`, `composition.test.ts` y `helpers.ts`.
- `odd/tasks/application-layer.md` + espejo en Engram.

**Cambios vs plan:** ninguno en el alcance. Se documentó la discrepancia de conteo 16 vs 18 (ver nota arriba). La política de proyecto sin PRs se mantiene (commits de work-unit + merge directo a `main`).

**Dependencias:** `02-architecture-foundation` ✅ · `06-domain-layer` ✅ · siguientes: `08-infrastructure-supabase` (adapters concretos), `09-spoonacular-adapter`, `10-recommendation-engine` (implementa `RecipeRecommendationService`), `11-api-layer` (mapea los errores de dominio a HTTP).

**Verificación:** `pnpm lint` ✅ · `pnpm typecheck` ✅ · `pnpm test` ✅ (18 archivos / 85 tests). La verificación independiente con subagente no estuvo disponible por una limitación del runtime (fallo de transporte, no del código); la evidencia se apoya en la autoverificación del writer y la re-ejecución de los tres checks por el orquestador.

## Resultado esperado

Capa de aplicación completa: los 18 casos de uso autorizados y testeables, que la API (spec 11) y el frontend (specs 12–14) consumirán sin duplicar lógica de negocio.
