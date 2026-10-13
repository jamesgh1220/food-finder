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

- [x] T1 — Rama `feat/13-dashboard-pantry`, feature doc + mirror Engram. (inline)
- [x] T2 — Shell y copy: `dashboard/layout.tsx` (header compartido con Suspense),
      refactor de `dashboard/page.tsx` (quitar shell duplicado), claves i18n
      `dashboard.*` y `pantry.*` nuevas en `messages.ts`. (delegated writer)
- [x] T3 — Dashboard completo: página server con searchParams
      (`mealType|cuisineId|search`), enriquecimiento pantry→nombres, fetch de
      cuisines, resultados `FindRecipesFromPantry` con `RecipeGrid`/`RecipeCard`/
      `RecipeMatchScore`/`MissingIngredients`, chips `Badge` (ver nota) + link
      gestionar despensa; `DashboardControls` client (selectores → URL, botón
      **Encontrar recetas**). (delegated writer)
- [x] T4 — Server Actions de pantry (`src/app/dashboard/pantry/actions.ts`,
      `'use server'`): `searchIngredients`, `addPantryIngredient`,
      `updatePantryIngredient`, `removePantryIngredient`, `clearUserPantry` —
      zod + `{ ok, error? }` + `refresh()`. (delegated writer)
- [x] T5 — Pantry: `src/app/dashboard/pantry/page.tsx` (server, carga inicial +
      enriquecimiento) y contenedor client `PantryManager` que integra
      `IngredientSearch` + `PantryList` + limpiar despensa, con estados
      loading/empty/error y `EmptyState` guía (REQ-08). Tests de
      `PantryManager` (test-first) entregados en esta tarea. (delegated writer)
- [x] T6 — Tests RTL: `dashboard-controls`, `dashboard-page` (estados + guardas)
      y auditoría de frontera server/client; se reutilizan helpers de spec 12.
      (delegated writer)
- [x] T7 — Verificación: `pnpm lint && pnpm typecheck && pnpm test && pnpm
      build`. (inline, bounded commands)

### Nota de alcance T3 (chips)

Los chips de despensa se renderizaron con el `Badge` compartido en lugar de
`IngredientSelector`: ese componente exige `onRemove` (props no opcionales) y
siempre dibuja un botón de quitar, así que usarlo como display puro obligaría a
un affordance muerto o a tocar el componente de spec 12. `Badge variant="accent"`
reproduce el mismo visual. Decisión aceptada; revisable si se quiere un
`IngredientSelector` con `onRemove` opcional.

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

Commits de work-unit en `feat/13-dashboard-pantry`:

- `0efcea1` docs(odd): add spec 13 dashboard pantry task doc. (T1)
- `be02bbd` feat(dashboard): add shared shell, dashboard page and filters. (T2+T3)
- `d598068` feat(pantry): add pantry page, server actions and manager. (T4+T5)
- `2746408` fix(dashboard): redirect on expired session and clarify copy.
- `21514e9` test(dashboard): cover controls, page states and source boundary. (T6)

RDD / verificación (RDD **off** decidido en global — `gentle-ai review mode
status`): sin review nativo ni lenses (runtime `opencode` no elegible; además el
switch está apagado). El gate de verificación delegada dio tier `high`
(`assess` → `unassessable`), así que se aplicó writer self-verification **más un
verificador independiente read-only** sobre `be02bbd`:

- Veredicto: VERIFIED WITH FINDINGS — 0 blocker, 0 major, 4 minor, 4 nit.
- Corregido en `2746408`: (1) comentario inexacto del layout sobre tipos
  generados; (3) sesión expirada en plena carga ahora redirige a `/login` en
  dashboard y pantry en vez de mostrar error genérico; (4) copy de carga del
  dashboard neutralizada.
- Aceptado/documentado sin cambio: (2) cambiar un filtro conserva `search=1` y
  re-ejecuta recomendaciones (filtrado vivo intencional); (5) chips con `Badge`;
  (6) `ErrorState` sin retry (el reload del browser reintenta); (7) el
  enriquecimiento carga todo el catálogo de ingredientes (decisión ya registrada,
  optimizable con un `findByIds` futuro); (8) claves `pantry.*` adelantadas
  (consumidas por T4/T5).

Verificación final (T7):

- `pnpm lint`: PASS.
- `pnpm typecheck`: PASS.
- `pnpm test`: PASS — 44 archivos, 271 tests (11 nuevos de T6 + 6 de T5).
- `pnpm build`: PASS — `/dashboard` y `/dashboard/pantry` como `◐` Partial
  Prerender (shell estático + contenido dinámico en streaming); URLs exactas
  confirmadas en la tabla de rutas.

Nota TDD (honesta): T5 aplicó test-first real (RED = fallo de resolución del
módulo del contenedor inexistente → GREEN). T2/T3 y T4-T6 de UI se escribieron y
verificaron con `typecheck`/`lint`/suite; los tests de `dashboard-*` (T6) se
autoraron contra las APIs ya observadas y pasaron en su primera corrida salvo el
harness del page server (limitación documentada, no del producto).

Entregables:

- `src/app/dashboard/layout.tsx`: shell autenticado compartido (Suspense + auth).
- `src/app/dashboard/page.tsx`: dashboard completo con `searchParams`
  (`mealType|cuisineId|search`), enriquecimiento pantry→nombres, cuisines,
  resultados y estados.
- `src/components/dashboard/{dashboard-controls.tsx,index.ts}`: controles
  client que escriben la URL + form GET **Encontrar recetas**.
- `src/app/dashboard/pantry/{page.tsx,actions.ts}`: página server + 5 Server
  Actions (`'use server'`, zod, `{ ok, message? }`, `refresh()`).
- `src/components/pantry/pantry-manager.tsx` + barril: contenedor client de CRUD
  con confirmación de limpiado y `EmptyState` guía.
- Copy en `src/lib/i18n/messages.ts` (`dashboard.*`, `pantry.*`).
- Tests: `tests/unit/components/pantry-manager.test.tsx`,
  `dashboard-controls.test.tsx`, `dashboard-page.test.tsx` y auditoría de
  frontera ampliada.

## Acceptance criteria

- [x] `/dashboard` exige autenticación y muestra: saludo, selector de tipo de
      comida, chips de ingredientes disponibles, selector de cocina (default
      `Todas`), botón **Encontrar recetas** y resultados (tests + build).
- [ ] CRUD de pantry end-to-end contra datos reales — **pendiente**: los tests
      unitarios cubren el cableado con acciones mockeadas; falta el flujo E2E
      (spec 16, flujos 3–6) con Supabase sembrado.
- [ ] Sin cocina → resultados multi-cocina (Caso 2); con `cuisine = Peruana` →
      resultados peruanos (Caso 3) — **pendiente**: verificación en navegador
      contra datos sembrados (spec 15/16); no ejecutable en esta pasada unitaria.
- [x] Búsqueda de ingrediente case-insensitive (`TOMATE` → `Tomate`): la
      garantiza el repositorio (`ilike` sobre `normalized_name`); el cableado de
      la Server Action está cubierto por tests.
- [x] Despensa vacía → `EmptyState` amigable, no pantalla rota (tests).
- [x] URLs finales exactas `/dashboard` y `/dashboard/pantry` (tabla de build).
- [x] Estados loading/empty/error presentes en las obtenciones.
- [x] Sin hops a `/api/*` desde Server Components; sin Redux/estado global
      (auditoría `client-boundary` + review).
- [x] `pnpm lint && pnpm typecheck && pnpm test && pnpm build` en verde.

## Next step

Núcleo de spec 13 implementado y verificado en unit/build. Falta cerrar la
aceptación que exige datos reales: correr los flujos E2E 3–6 de spec 16
(dashboard, agregar ingredientes, elegir meal type, buscar, ver resultados) con
la base sembrada para validar los Casos 2 y 3 y el CRUD end-to-end. Después,
continuar con spec 14 (recipes/favorites) sobre estos resultados. Commits en
`feat/13-dashboard-pantry` a la espera de decisión del usuario (PR / merge).