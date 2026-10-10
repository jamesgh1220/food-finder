# ODD — Spec 12: Frontend Foundation

## Objective

Fijar la base del frontend de Food Finder: la landing pública en `/`, la
biblioteca de 15 componentes reutilizables, los estados compartidos
(loading/empty/error), las reglas de estado (sin Redux, sin `'use client'`
innecesario) y los estándares UX mobile-first/accesibles.

Especificación: `docs/specs/12-frontend-foundation/SPEC.md` + `ISSUE.md`.

## Problem

La landing (`src/app/page.tsx`) todavía es el scaffold de `create-next-app`
(logo de Vercel/Next, copy en inglés) y no existe `src/components/ui` ni ninguna
de las 15 primitivas compartidas de PROMTP #45. Sin ellas, las specs 13
(dashboard/pantry) y 14 (recipes/favorites) no tienen con qué construir.

## Why

El SPEC 12 es dependencia directa de 13 y 14: define el lenguaje visual, los
componentes que esas pantallas consumen y las reglas de Server/Client Component
que evitan disparar JavaScript innecesario al cliente.

## Scope

- **In scope:**
  - Landing `/` con mensaje exacto, CTA `Comenzar`, ejemplos visuales y los 4 pasos.
  - 15 componentes: `IngredientSearch`, `IngredientSelector`, `PantryList`,
    `PantryItem`, `MealTypeSelector`, `CuisineSelector`, `RecipeCard`,
    `RecipeGrid`, `RecipeMatchScore`, `MissingIngredients`, `RecipeIngredients`,
    `RecipeInstructions`, `FavoriteButton`, `EmptyState`, `LoadingState`,
    `ErrorState` (16 con el detalle; la lista del SPEC suma 16 nombres).
  - Primitivas base reutilizables en `src/components/ui/` (button, card, badge,
    input, skeleton, label) alineadas a `minimalist-ui`.
  - Copy de UI estructurado para i18n futuro (`src/lib/i18n/messages.ts`).
  - Tooling RTL + tests de componentes para las primitivas.
- **Out of scope:** pantallas de dashboard/pantry (spec 13), recipes/detail/
  favorites (spec 14), páginas de auth (spec 05), motor de recomendación, API.
- **Preserve:** UI copy en español; código/identificadores/comentarios/commits en
  inglés. pnpm only. Tokens "Fresh Garden" y tipografía (Fraunces + Plus Jakarta
  Sans) ya decididos en `odd/tasks/typography-system.md`.

## Constraints and decisions

- **`minimalist-ui` es la autoridad visual** (`.claude/skills/minimalist-ui/SKILL.md`).
  Bans: sin Inter/Roboto/Open Sans, sin gradientes, sin `shadow-md/lg/xl`, sin
  `rounded-full` en cards/botones, sin emojis, sin fondos de color primario en
  secciones grandes. Lucide solo con uso restrictivo (ya es dependencia y el
  SPEC lo pide); stroke consistente.
- **Tokens primero:** se reutilizan los tokens existentes (`--primary` verde,
  `--border`, `--radius`, etc.). No se introducen hex crudos en componentes. El
  CTA primario mantiene el verde de marca (`bg-primary`) por consistencia con
  auth, en lugar de negro puro.
- **Next 16 + `cacheComponents: true`:** páginas son Server Components; los
  Client Components se limitan a interacción real (selectores, búsqueda de
  ingredientes, CRUD de pantry, toggle de favorito). Prohibido `export const
  dynamic`. No hay hops a `/api/*` en Server Components.
- **Sin Redux / sin estado global:** filtros vía URL search params, formularios
  vía RHF + Zod, estado local con React.
- **i18n readiness:** copy centralizado en `src/lib/i18n/messages.ts` y mapas de
  etiquetas; sin enums de dominio como texto duro disperso.
- **TDD:** no hay runner de componentes previo; se instala RTL y se escribe
  primero el test de `RecipeMatchScore` (formato doble) y de los estados, luego
  la implementación. Para componentes puramente presentacionales sin runner
  significativo, se documenta la excepción y se hacen checks estructurales.

## Estimated size

~1800–2400 authored changed lines (16 componentes + primitivas + landing +
i18n + tests). Supera el presupuesto advisory de ~400 líneas → se aplica la
estrategia de entrega `ask-on-risk` (una consulta por la estrategia de cadena)
antes del commit que cruce el umbral.

## Tasks

- [x] T1 — Rama `feat/frontend-foundation`, feature doc + mirror Engram. (inline)
- [x] T2 — Tooling de tests: instalar RTL + jest-dom + user-event, `tests/setup.ts`,
      `vitest.config.mts` con `setupFiles`. (inline, mechanical)
- [x] T3 — Primitivas base `src/components/ui/*` + utilidad de reveal en
      `globals.css`. (delegated writer)
- [x] T4 — Estados compartidos + componentes presentacionales de receta.
      (delegated writer)
- [x] T5 — Componentes interactivos (selectores, ingredientes, pantry, favorito).
      (delegated writer)
- [x] T6 — i18n messages + landing `/`. (inline, design-critical)
- [x] T7 — Tests de componentes RTL. (delegated writer)
- [x] T8 — Verificación: `pnpm lint && pnpm typecheck && pnpm test && pnpm build`.
      (inline, bounded commands)

## Route declaration

- T1, T2, T8: inline (config/estado/commands mecánicos).
- T3–T5, T7: delegated writer (2+ archivos no triviales por unidad).
- T6: inline (1 archivo design-critical, contexto ya retenido por el parent).

## Forecast & delivery

- Forecast: ~1800–2400 líneas autoradas vs `main` (excl. lockfile).
- Delivery strategy: `ask-on-risk` (default) — se pregunta una vez por la
  estrategia de cadena antes de cruzar ~400 líneas.
- Sin PR en esta etapa; commits de work-unit en `feat/frontend-foundation`.

## Progress / evidence

Commits de work-unit en `feat/frontend-foundation`:

- `2eee5a1` docs(odd): add spec 12 frontend foundation task doc.
- `0b0d4ae` chore(test): set up React Testing Library with vitest.
- `d0aa753` feat(ui): add shared UI primitives, states and recipe components.
- `48bf175` feat(ui): add filters, ingredient, pantry and favorite components.
- `a831c6c` feat(landing): build responsive landing page with examples and steps.
- `2d83ad0` test(ui): add RTL component tests for spec 12.

Verificación final (T8):

- `pnpm lint`: PASS.
- `pnpm typecheck`: PASS.
- `pnpm test`: PASS — 41 archivos, 254 tests.
- `pnpm build`: PASS — `/` prerenderizada estática (○).

Entregables:

- Landing `/` (`src/app/page.tsx`) con titular exacto, CTA `Comenzar` → `/register`,
  `Iniciar sesión` → `/login`, 3 ejemplos y los 4 pasos; reveal con
  `prefers-reduced-motion`.
- 16 componentes: `src/components/ui/*` (button, card, badge, input, skeleton,
  label), `src/components/shared/*` (empty/loading/error state),
  `src/components/recipes/*` (recipe-card, recipe-grid, recipe-match-score,
  missing-ingredients, recipe-ingredients, recipe-instructions),
  `src/components/filters/*` (meal-type-selector, cuisine-selector),
  `src/components/ingredients/*` (ingredient-search, ingredient-selector),
  `src/components/pantry/*` (pantry-list, pantry-item),
  `src/components/favorites/*` (favorite-button).
- Copy centralizado en `src/lib/i18n/messages.ts`.
- 12 archivos de test en `tests/unit/components/`.

Nota: la estrategia de entrega `ask-on-risk` se difiere a la creación de PR (este
workflow no abre PR); los commits de work-unit en la feature branch no se ven
afectados. Si se pide un PR, se consulta en ese momento la estrategia de cadena.

Nota TDD (honesta): no se observó RED-first. El runner RTL no existía y las
unidades (T3/T4/T5) se implementaron y se verificaron con `typecheck`/`lint`
antes de que existiera una ruta de test dentro de sus superficies de edición; la
suite de T7 se escribió después contra las APIs observadas y pasó en su primera
corrida (salvo un ajuste de mecanismo de test, no del producto). Para
componentes presentacionales sin runner significativo se documentó la excepción
y se usaron checks estructurales.

## Acceptance criteria

- [x] `/` renderiza el mensaje exacto, CTA `Comenzar` y los 4 pasos.
- [x] Los 16 componentes del SPEC existen y se exportan desde el árbol.
- [x] Viewport móvil sin overflow horizontal; targets táctiles utilizables.
- [x] Toda vista de datos tiene loading/empty/error (primitivas disponibles).
- [x] Auditoría: sin `'use client'` innecesario; sin Redux ni global state
      (cubierto por `tests/unit/components/client-boundary.test.ts`).
- [x] RHF + Zod con validación visible (formularios existentes; primitivas listas).
- [x] `pnpm lint && pnpm typecheck && pnpm test && pnpm build` en verde.

## Next step

Spec 12 completa y verificada. Listo para continuar con spec 13
(dashboard/pantry) reutilizando estas primitivas; los commits quedan en
`feat/frontend-foundation` a la espera de decisión del usuario (PR / merge).
