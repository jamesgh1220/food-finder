# ODD — Spec 13: Dashboard y Pantry

## Objective

Construir el centro del producto: la ruta autenticada `/dashboard` (saludo,
selector de tipo de comida, chips de despensa, selector de cocina, botón
**Encontrar recetas** y resultados de recomendación) y el gestor de despensa
`/dashboard/pantry` (buscar/agregar/editar/eliminar/limpiar ingredientes con
cantidad/unidad), ambos desde Server Components que invocan use cases
directamente (regla de hops, spec 02).

Especificación: `docs/specs/13-frontend-dashboard-pantry/SPEC.md` + `ISSUE.md`.

## Problem

`src/app/dashboard/page.tsx` es un placeholder: protege, saluda y dice que la
despensa "aparecerá aquí", pero no tiene selector de tipo de comida, ni chips de
ingredientes, ni selector de cocina, ni búsqueda, ni resultados. No existe
`/dashboard/pantry` ni ninguna ruta para gestionar la despensa. Los use cases de
pantry/ingredientes/cocina/recomendaciones y los 16 componentes de spec 12 ya
están listos: falta la capa de presentación que los conecte.

## Why

Sin el dashboard y el pantry el producto no tiene corazón usable: el usuario no
puede declarar qué tiene en su cocina ni lanzar recomendaciones. Es la
dependencia directa de spec 14 (recipes/favorites), que consume los `RecipeCard`
y el flujo de resultados que esta spec 13 expone.

## Scope

- **In scope:**
  - `/dashboard`: auth protegida (ya cubierta por `src/proxy.ts`), saludo,
    `MealTypeSelector` (Desayuno/Almuerzo/Cena/Cualquier momento), chips de
    ingredientes de la despensa (`IngredientSelector`), `CuisineSelector`
    opcional (default `Todas`), botón **Encontrar recetas** y resultados con
    `RecipeGrid` + `RecipeCard` + `RecipeMatchScore` + `MissingIngredients`.
  - `/dashboard/pantry`: `IngredientSearch` (case-insensitive),
    `IngredientSelector`, `PantryList`, `PantryItem`; CRUD completo
    (agregar/editar cantidad+unidad/eliminar) y limpiar despensa.
  - Filtro extensible: modelo completo `ingredients, mealType, cuisine,
    maxPreparationTime, difficulty, diet`; el MVP implementa solo
    `ingredients, mealType, cuisine` sin bloquear la forma (#70) — estado del
    dashboard como objeto con forma extensible.
  - Estados loading/empty/error en todas las obtenciones; despensa vacía →
    `EmptyState` amigable que guía a agregar ingredientes (REQ-08).
  - Copy de UI centralizado (nuevas claves en `messages.ts`).
- **Out of scope:** rutas de recetas/detalle/favoritos (spec 14), algoritmo de
  recomendación (spec 10, ya implementado), componentes compartidos (spec 12,
  ya implementados), endpoints `/api/*` (spec 11; no se usan desde Server
  Components — espec 02 REQ-11).
- **Preserve:** URL final exacta `/dashboard` y `/dashboard/pantry` (sin route
  groups que alteren la URL — REQ-07); UI copy en español; código/comentarios/
  commits en inglés; pnpm only; `minimalist-ui` como autoridad visual; sin
  Redux/estado global; Client Components solo para interacción.

## Constraints and decisions

- **Ruta de datos:** Server Component → Use Case → Repository → Supabase. Los
  Server Components **nunca** hacen `fetch` a sus propios `/api/*` (spec 02
  REQ-11 + spec 11 REQ-10). `/dashboard/pantry/page.tsx` es Server Component
  que carga datos iniciales; las mutaciones del pantry van por **Server
  Actions** (`'use server'`) que invocan los use cases directamente y llaman
  `refresh()` (Next 16) para re-renderizar el payload RSC actual — verificado
  contra `node_modules/next/dist/docs/01-app/02-guides/server-actions.md`.
- **`searchParams` es Promise en Next 16** (page.md): `await searchParams` en el
  dashboard; opta la página a dynamic rendering en tiempo de petición — el
  header shell vive en `dashboard/layout.tsx` con el patrón `<Suspense>` de
  Cache Components (cookies() detrás de límite), ya validado en la spec 12.
- **URL como fuente de verdad para filtros del dashboard:** `MealTypeSelector` y
  `CuisineSelector` actualizan la URL (`router.replace`) desde
  `DashboardControls` (client); el flag de búsqueda (`search=1`) lo pone el
  botón **Encontrar recetas**; la página server lee los params y ejecuta
  `FindRecipesFromPantry` solamente cuando el flag está activo. Sin estado
  global, sin Redux.
- **Name gap (hallazgo):** `GetUserPantry` devuelve `PantryItem[]` sin nombre de
  ingrediente; `PantryItemData` (UI) requiere `name`. La página server enriquece
  los items mapeando `SearchIngredients.execute({})` por `ingredientId` una sola
  vez.
- **`RecommendedRecipe`** (`application/ports/recipe-recommendation.ts`) ya
  entrega `{ recipe, matchScore, availableIngredients, missingIngredients,
  optionalMissingIngredients }` — coincide 1:1 con las props de `RecipeCard`.
- **Server Actions = untrusted entry points:** cada acción valida inputs con zod
  (shape) y deriva identidad desde la sesión; los use cases ya lanzan
  `UnauthorizedError` vía `requireAuthenticatedUser`. Las acciones devuelven un
  resultado serializable `{ ok, error? }` (nunca registros crudos) y llaman
  `refresh()` tras mutar para leer-tus-propios-writes.
- **RDD:** `gentle-ai review mode status` → **off (decidido global)**. No se
  inician reviews ni se reactiva el switch; checks ordinarios
  (`lint`/`typecheck`/`test`/`build`) intactos.
- **TDD:** hay runner RTL (spec 12) y tests de componentes. Los writers de
  contenedores client aplican test-first donde la unidad lo permite (test con
  actions mockeadas → implementación). Si no es práctico, documentar la
  excepción; nunca inventar evidencia RED/GREEN.
- **`minimalist-ui` es autoridad visual** (`.claude/skills/minimalist-ui/
  SKILL.md`); bans vigentes (sin Inter, gradientes, sombras pesadas,
  `rounded-full` en cards/botones, emojis). Tokens existentes, sin hex crudos.

## Estimated size

~800–1200 authored changed lines (layout + dashboard + pantry + acciones +
i18n + tests). Supera el presupuesto advisory de ~400 → estrategia de entrega
`ask-on-risk`; **misma deferencia que spec 12**: la consulta de estrategia de
cadena se difiere a la creación de PR (este workflow no abre PR).

## Tasks

- [ ] T1 — Rama `feat/13-dashboard-pantry`, feature doc + mirror Engram. (inline)
- [ ] T2 — Shell y copy: `dashboard/layout.tsx` (header compartido con Suspense),
      refactor de `dashboard/page.tsx` (quitar shell duplicado), claves i18n
      `dashboard.*` y `pantry.*` nuevas en `messages.ts`. (delegated writer)
- [ ] T3 — Dashboard completo: página server con searchParams
      (`mealType|cuisineId|search`), enriquecimiento pantry→nombres, fetch de
      cuisines, resultados `FindRecipesFromPantry` con `RecipeGrid`/`RecipeCard`/
      `RecipeMatchScore`/`MissingIngredients`, chips `IngredientSelector` +
      link gestionar despensa; `DashboardControls` client (selectores → URL,
      botón **Encontrar recetas**). (delegated writer)
- [ ] T4 — Server Actions de pantry (`src/app/dashboard/pantry/actions.ts`,
      `'use server'`): `searchIngredients`, `addPantryIngredient`,
      `updatePantryIngredient`, `removePantryIngredient`, `clearUserPantry` —
      zod + `{ ok, error? }` + `refresh()`. (delegated writer)
- [ ] T5 — Pantry: `src/app/dashboard/pantry/page.tsx` (server, carga inicial +
      enriquecimiento) y contenedor client `PantryManager` que integra
      `IngredientSearch` + `PantryList` + limpiar despensa, con estados
      loading/empty/error y `EmptyState` guía (REQ-08). (delegated writer)
- [ ] T6 — Tests RTL: `dashboard-controls`, `pantry-manager` (add/edit/remove/
      clear con actions mockeadas), estados; reutilizar helpers de spec 12.
      (delegated writer)
- [ ] T7 — Verificación: `pnpm lint && pnpm typecheck && pnpm test && pnpm
      build`. (inline, bounded commands)

## Route declaration

- T1, T7: inline (estado/docs/commands mecánicos).
- T2–T6: delegated writer (archivos no triviales por unidad; los writers
  reciben superficies de edición exactas y la heurística advisory de ~400
  líneas por tarea).

## Forecast & delivery

- Forecast: ~800–1200 líneas autoradas vs `main` (excl. lockfile).
- Delivery strategy: `ask-on-risk` (default), consulta diferida a PR (precedente
  spec 12). Commits de work-unit en `feat/13-dashboard-pantry`.

## Progress / evidence

(Por llenar por tarea: commit hash + verificación observada + tier RDD.)

- T1: rama `feat/13-dashboard-pantry` creada desde `main` limpio; doc +
  mirror Engram. RDD: off global (sin assess/review).
- T2..T6: pendientes.

## Acceptance criteria

- [ ] `/dashboard` exige autenticación y muestra: saludo, selector de tipo de
      comida, chips de ingredientes disponibles, selector de cocina (default
      `Todas`), botón **Encontrar recetas** y resultados de recomendación.
- [ ] CRUD de pantry end-to-end contra datos reales: agregar `papa`, `carne`,
      `huevo` → visibles; editar cantidad/unidad persiste tras recargar;
      eliminar y limpiar funcionan.
- [ ] Búsqueda de ingrediente case-insensitive (`TOMATE` → `Tomate`).
- [ ] Sin cocina → resultados multi-cocina (Caso 2); con `cuisine = Peruana` →
      resultados peruanos (Caso 3).
- [ ] Despensa vacía → `EmptyState` amigable, no pantalla rota.
- [ ] URLs finales exactas `/dashboard` y `/dashboard/pantry`.
- [ ] Estados loading/empty/error presentes en todas las obtenciones.
- [ ] Sin hops a `/api/*` desde Server Components; sin Redux/estado global.
- [ ] `pnpm lint && pnpm typecheck && pnpm test && pnpm build` en verde.

## Next step

Spec 13 implementada y verificada; seguir con spec 14 (recipes/favorites) sobre
estos resultados. Commits quedan en `feat/13-dashboard-pantry` a la espera de
decisión del usuario (PR / merge).