# ODD — Spec 07: Capa de aplicación (casos de uso y DTOs)

## Objetivo
Implementar la capa application: los casos de uso de pantry, recipes, cuisine y favorites
(auth ya existe desde la spec 05) con DTOs, orquestación de repositorios/servicios,
autorización a nivel de caso de uso y los puntos de extensión futuros (IA y preferencias
de usuario) diseñados pero no implementados.

## Por qué
La capa application es el contrato que conecta UI/API con el dominio. Todos los flujos del
MVP deben expresarse como casos de uso testeables con puertos mockeados, con autorización
propia (defensa en profundidad junto con RLS), sin depender de Supabase/Spoonacular/Next.

## Alcance autorizado
- **Dentro:** `src/application/` (puertos nuevos, DTOs, helper de autorización, 14 casos de
  uso nuevos + barrel), `src/lib/composition/application.ts` (composition root de la capa),
  tests unitarios de aplicación en `tests/unit/application/`, y una regla ESLint de pureza
  para `src/application/**`.
- **Fuera de alcance (prohibido):** internals del motor de recomendación (spec 10), mapeo
  HTTP / Route Handlers (spec 11), adapters concretos de repositorio (spec 08), UI (specs
  12–14), IA real, preferencias de usuario implementadas.

## Discrepancia de conteo (documentar)
El SPEC/ISSUE hablan de "16 casos de uso", pero la enumeración autoritativa (PROMTP #13)
suma **18**: Auth (4) + Pantry (5) + Recipes (4) + Cuisine (2) + Favorites (3). Auth ya
existe (spec 05). Se implementan los **14 nuevos** y se registra la discrepancia en ISSUE.md
de la spec 07.

## Restricciones
- pnpm ONLY. **Comentarios de código en español** (preferencia del proyecto, 2026-10-08).
  UI copy español; identificadores/commits en inglés.
- Hexagonal: `src/application/**` NO importa `next`, `react`, `@supabase/*`, Spoonacular,
  `@/app/*`, `@/components/*`, `@/infrastructure/*`, ni usa `fetch` global. Los adapters se
  inyectan vía composition root.
- Los casos de uso dependen SOLO de interfaces/puertos (`src/domain/ports` + puertos de
  `src/application/ports`).
- Autorización en el caso de uso: el `userId` sale SIEMPRE de `AuthPort.getCurrentUser()`
  (sesión de servidor), nunca del input del cliente. No autenticado → `UnauthorizedError`.
- Fallos esperados se expresan con la taxonomía de errores de dominio (`UnauthorizedError`,
  `NotFoundError`, `ConflictError`, `ValidationError`). El mapeo a HTTP es de la spec 11.
- `cuisineId` en `FindRecipesFromPantry` es OPCIONAL; ausente/null = `ALL` (sin filtro).
- TDD estricto: NO configurado → checks funcionales ordinarios.
- RDD: **off** (clone-local) → sin ceremonia de revisión; verificación por tier del diff.
- Entrega: política del proyecto **sin PRs** → commits de work-unit en rama feature y merge
  directo a `main`.

## Contratos a implementar

### Puertos nuevos (`src/application/ports/`)
- `recipe-recommendation.ts` — `RecipeRecommendationService` (implementado por spec 10),
  `RecipeRecommendationRequest`, `RecommendedRecipe` (forma de PROMTP #71).
- `recipe-recommendation-enhancer.ts` — `RecipeRecommendationEnhancer` (extensión IA futura,
  SOLO diseño, sin lógica).
- `user-preferences.ts` — `UserPreferences` futura (PROMTP #87, SOLO diseño).

### Shared
- `src/application/shared/require-authenticated-user.ts` — `requireAuthenticatedUser(auth)`.

### Casos de uso nuevos
- **Pantry:** `AddPantryIngredient`, `UpdatePantryIngredient`, `RemovePantryIngredient`,
  `GetUserPantry`, `ClearUserPantry`.
- **Recipes:** `FindRecipesFromPantry`, `GetRecipeById`, `SearchRecipes`,
  `GetRecipesByMealType`.
- **Cuisine:** `GetCuisines`, `GetCuisineById`.
- **Favorites:** `AddFavoriteRecipe`, `RemoveFavoriteRecipe`, `GetFavoriteRecipes`.

### Composition root
- `src/lib/composition/application.ts` — `createApplicationServices(deps)` cablea los 18
  casos de uso (4 auth reutilizando `createAuthServices` + 14 nuevos) a partir de puertos
  inyectados. Tests inyectan mocks.

## Tareas
- [x] T1 — Rama `feat/07-application-layer` desde `main`.
- [x] T2 — Documento ODD + espejo en Engram.
- [x] T3 — Puertos de extensión/IA/preferencias + `requireAuthenticatedUser`.
- [x] T4 — Casos de uso Pantry (5) con autorización.
- [x] T5 — Casos de uso Recipes (4), cuisine opcional en `FindRecipesFromPantry`.
- [x] T6 — Casos de uso Cuisine (2) y Favorites (3) con autorización.
- [x] T7 — Barrel `src/application/index.ts`.
- [x] T8 — Composition root `createApplicationServices`.
- [x] T9 — Regla ESLint de pureza para `src/application/**`.
- [x] T10 — Tests unitarios de aplicación con mocks + test de pureza + composition.
- [x] T11 — Verificación `pnpm lint && pnpm typecheck && pnpm test`.
- [x] T12 — Actualizar `docs/specs/07-application-layer/ISSUE.md` (convención del proyecto).
- [x] T13 — Commits de work-unit + merge directo a `main`.

## Criterios de aceptación (SPEC 07)
- [ ] Los casos de uso existen, son testeables de forma independiente con puertos mockeados
      y cubren verificación de autorización para datos de usuario.
- [ ] Ningún caso de uso importa Supabase/Spoonacular/Next.js (test de pureza + ESLint).
- [ ] `FindRecipesFromPantry` sin cuisine devuelve resultados multi-cocina (cuisine opcional).
- [ ] Puntos de extensión de REQ-09 existen como interfaces documentadas — cero lógica de IA.

## Forecast de entrega
- Forecast authored changed lines (additions + deletions, tests incluidos): **~900–1100**
  → >400 (heurística). Política fijada por el usuario: **sin PRs**; se entrega como commits
  de work-unit y merge directo a `main`.
  - S1: puertos/extension points + shared.
  - S2: casos de uso + barrel.
  - S3: composition root + ESLint.
  - S4: tests + verificación.

## Verificación
- `pnpm lint && pnpm typecheck && pnpm test`.
- Auditoría de imports automatizada (test) sobre `src/application/**`.

## Progreso
Completado (2026-10-09). 14 casos de uso nuevos + 4 auth reutilizados (18 cableados), puertos
de extensión inertes, composition root y regla de pureza. Commits de work-unit:
`120f714`, `2831fb8`, `42d0303`, `838074c`, `3025282`, `4db39c8` (merge ff a `main`).
Verificación: `pnpm lint` ✅ · `pnpm typecheck` ✅ · `pnpm test` ✅ (18 archivos / 85 tests).
Verificación independiente con subagente no disponible por limitación de runtime (fallo de
transporte, no del código): la evidencia es la autoverificación del writer + re-ejecución de
los tres checks por el orquestador.
