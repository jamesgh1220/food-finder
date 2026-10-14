# ODD — Spec 14: Recetas, detalle y favoritos

## Objective

Construir las tres superficies de descubrimiento sobre `RecipeCard`/`RecipeGrid`/
`RecipeMatchScore`/`MissingIngredients` (spec 12) y el motor de recomendación
(spec 10): la cuadrícula `/dashboard/recipes` con filtros, el detalle
`/dashboard/recipes/[id]` y los favoritos `/dashboard/favorites`. El score
siempre se explica en palabras (nunca un número abstracto).

Especificación: `docs/specs/14-frontend-recipes-favorites/SPEC.md` + `ISSUE.md`.

## Problem

`/dashboard` (spec 13) renderiza las recomendaciones inline con `search=1`, pero no
existen `/dashboard/recipes`, `/dashboard/recipes/[id]` ni `/dashboard/favorites`.
Tampoco existe ninguna forma de leer los ingredientes con cantidades de una receta
(`RecipeRepository.findById` no trae `recipe_ingredients`; el caso de uso
`GetRecipeIngredients` no está en PROMTP #13). Falta toda la capa de presentación de
descubrimiento.

## Why

Sin estas rutas el ciclo MVP «ingredientes → recomendaciones → descubrimiento» no
cierra: el usuario no puede filtrar, entender cada recomendación, ver el detalle
completo ni guardar favoritos persistentes.

## Decisions

- **Los resultados viven en `/dashboard/recipes`** (decisión explícita del usuario
  en esta sesión). `/dashboard` queda como *entrada de búsqueda* (saludo, meal type,
  chips de despensa, cocina, botón **Encontrar recetas**) y el botón pasa a apuntar a
  `/dashboard/recipes`. Esto coincide con PROMTP #42 y con la dependencia de spec 14
  que llama a spec 13 «entrada de búsqueda». Implica actualizar los tests de spec 13
  que asumían resultados inline.
- **Gap descubierto — read path de ingredientes**: REQ-02 exige «ingredientes con
  cantidades» y la entidad `RecipeIngredient` (PROMTP #10) existe, pero ningún caso
  de uso ni método de puerto la expone. Se añade el camino mínimo hexagonal:
  `RecipeRepository.findIngredients(recipeId)` → `GetRecipeIngredients`.
- **Match score del detalle**: se reutiliza `FindRecipesFromPantry` (sin tocar el
  motor, fuera de alcance) y se busca la receta por id en los resultados. Si no
  aparece (receta externa no regenerada, o sin ingredientes), el bloque de score se
  omite: degradación elegante (REQ-09).

## Scope

- **In scope:** `/dashboard/recipes` (filtros + grid + estados), `/dashboard/recipes/
  [id]` (todos los campos de REQ-02), `/dashboard/favorites` (lista + búsqueda +
  eliminar), Server Actions de favoritos, read path de ingredientes de receta, copy
  i18n, tests RTL, ajuste del dashboard de spec 13.
- **Out of scope:** motor de recomendación (spec 10), componentes compartidos
  (spec 12), endpoints `/api/*` (spec 11), flujos E2E con datos sembrados (spec 16).
- **Preserve:** UI copy en español, código/comentarios/commits en inglés, pnpm only,
  `minimalist-ui` como autoridad visual, sin Redux/estado global, Server Components →
  use case → repositorio (sin hops a `/api/*`).

## Specs

- **S1** (REQ-01) — `/dashboard/recipes` muestra filtros (cocina, tipo de comida) y una
  cuadrícula `RecipeGrid`/`RecipeCard`; por tarjeta: match score, ingredientes
  disponibles e ingredientes faltantes. Componentes: `MealTypeSelector`,
  `CuisineSelector`, `RecipeCard`, `RecipeGrid`, `RecipeMatchScore`, `MissingIngredients`.
- **S2** (REQ-02) — `/dashboard/recipes/[id]` muestra: nombre, imagen, descripción,
  cocina, país, región, ingredientes con cantidades, instrucciones, tiempo, porciones,
  dificultad, match score, ingredientes disponibles/faltantes, botón de favorito y fuente.
- **S3** (REQ-03) — `/dashboard/favorites` lista las recetas favoritas, permite buscar
  cuando aporta y eliminar un favorito.
- **S4** (REQ-04) — Cada resultado expone `recipe, matchScore, availableIngredients,
  missingIngredients, optionalMissingIngredients` (PROMTP #71, forma JSON de ejemplo).
- **S5** (REQ-05) — La UI del match score es comprensible: exactamente
  `"92% de coincidencia"` o `"Tienes 5 de 6 ingredientes"`; nunca solo un número.
- **S6** (REQ-06) — Modelo de filtros extensible (`maxPreparationTime`, `difficulty`,
  `diet` reservados); el MVP entrega solo `ingredients/mealType/cuisine` (PROMTP #70).
- **S7** (REQ-07) — Caso 4: mostrar disponibles **y** faltantes con claridad en tarjetas
  y detalle.
- **S8** (REQ-08) — El botón de favorito alterna estado optimista/persistente vía los
  casos de uso de favoritos; Caso 6: el favorito persiste en Supabase entre sesiones.
- **S9** (REQ-09) — El detalle maneja recetas internas y generadas por IA mostrando
  `source`; los fallos externos degradan con elegancia (spec 09), sin errores técnicos.
- **S10** (REQ-10) — Skeletons de carga, estados vacíos (sin resultados, sin favoritos)
  y estados de error en las tres vistas.
- **S11** (decisión) — Los resultados de «Encontrar recetas» viven en
  `/dashboard/recipes`; `/dashboard` es la entrada de búsqueda.
- **S12** (gap) — Read path de ingredientes de receta con cantidades:
  `RecipeRepository.findIngredients(recipeId): Promise<RecipeIngredientDetail[]>` +
  caso de uso `GetRecipeIngredients`.

## Tasks

- [x] T1 — Rama `feat/14-recipes-favorites`, feature doc + mirror Engram. (inline)
- [x] T2 — Read path ingredientes: `RecipeIngredientDetail` (domain), método en
      `RecipeRepository`, mapper, impl Supabase, use case `GetRecipeIngredients`,
      wiring y fakes de tests. (inline)
- [x] T3 — Copy i18n `recipes.*` / `favorites.*` / detalle en `messages.ts`. (inline)
- [x] T4 — Server Actions de favoritos (`src/app/dashboard/favorites/actions.ts`):
      `addFavoriteAction`, `removeFavoriteAction` (zod, `{ ok, message? }`, `refresh()`).
      (inline)
- [x] T5 — `/dashboard/recipes`: página server (auth, pantry, cuisines, filtros por URL,
      `FindRecipesFromPantry`, estados) + `RecipesFilters` client. (inline)
- [x] T6 — `/dashboard/recipes/[id]`: página server (receta, cocina, ingredientes, score)
      + `FavoriteToggle` client (envuelve `FavoriteButton`). (inline)
- [x] T7 — `/dashboard/favorites`: página server + `FavoritesList` client (búsqueda
      local + eliminar). (inline)
- [x] T8 — Ajuste dashboard spec 13: mover resultados fuera de `/dashboard`, botón
      → `/dashboard/recipes`, enlaces de nav Recetas/Favoritos, actualizar tests de
      spec 13. (inline)
- [x] T9 — Tests: RTL nuevos `recipes-page`, `recipe-detail-page`, `favorites-page`,
      `recipes-filters`, `favorite-toggle`; caso de uso `GetRecipeIngredients` cubierto
      en `recipes-use-cases.test.ts`; actualizados `dashboard-page`,
      `dashboard-controls`, `client-boundary`, `composition`, `repositories`. (inline)
- [x] T10 — Verificación: `pnpm lint && pnpm typecheck && pnpm test && pnpm build`.
      (inline)

## Route declaration

Delegación **no disponible** en este runtime: la primera invocación a
`gentle-ai-explore` falló con un error del proveedor (*free tier*). Al no existir
mecanismo de delegación, se siguió el camino de degradación documentado y todo el
trabajo se hizo **inline**, leyendo por lotes acotados. Todas las tareas son inline.

## Forecast & delivery

- Forecast: ~900–1300 líneas autoradas vs `main` (3 rutas + 2-3 contenedores client +
  acciones + read path + i18n + tests + ajuste dashboard).
- Supera el presupuesto advisory de ~400 → estrategia de entrega `ask-on-risk`.
  Igual que specs 12/13, la consulta de estrategia de cadena se difiere a la creación
  de PR (este workflow no abre PR). Commits de work-unit en `feat/14-recipes-favorites`.

## Progress / evidence

- **T2 — read path de ingredientes.** `RecipeIngredientDetail` (domain entity),
  `RecipeRepository.findIngredients` (puerto), `SupabaseRecipeRepository.findIngredients` +
  `recipe-ingredient-mapper`, use case `GetRecipeIngredients`, wiring en
  `createApplicationServices`. Fakes de tests actualizados (`favorites-use-cases`,
  `gemini-recipe-provider`, `repositories`).
- **T3 — i18n.** `recipesPage.*`, `recipeDetail.*`, `favorites.*` y `dashboard.recipesNav`
  en `src/lib/i18n/messages.ts`; `matchScore.percentage/ingredients` ya existían (spec 12).
- **T4 — Server Actions de favoritos.** `src/app/dashboard/favorites/actions.ts` con
  `addFavoriteAction`/`removeFavoriteAction` (zod, resultado discriminado, `refresh()`).
- **T5 — `/dashboard/recipes`.** Página server (`RecipesContent` tras `<Suspense>`) con
  filtros por URL (`mealType`, `cuisineId`), `FindRecipesFromPantry`, y estados
  sin-despensa / sin-resultados / error; `RecipesFilters` client.
- **T6 — `/dashboard/recipes/[id]`.** Página server con todos los campos de REQ-02, score
  de coincidencia reutilizando `FindRecipesFromPantry` (sin filtros), degradación elegante
  cuando la receta no aparece, `FavoriteToggle` client.
- **T7 — `/dashboard/favorites`.** Página server + `FavoritesList` client (búsqueda local
  por nombre + eliminar mediante Server Action).
- **T8 — ajuste dashboard spec 13.** Resultados movidos fuera de `/dashboard`; botón
  **Encontrar recetas** → `/dashboard/recipes`; enlaces de nav Recetas/Favoritos; claves
  i18n muertas (`results*`) eliminadas; tests de spec 13 actualizados.
- **T9 — tests.** 5 archivos nuevos de componentes + caso de uso en `recipes-use-cases`;
  6 archivos de tests existentes actualizados.

### Verification (comandos y resultados observados)

| Comando | Resultado |
| --- | --- |
| `pnpm lint` | limpio (0 errores, 0 warnings) |
| `pnpm typecheck` | limpio |
| `pnpm test` | 49 files / 310 tests passed |
| `pnpm build` | Next.js 16.4.0; rutas `/dashboard/recipes`, `/dashboard/recipes/[id]`, `/dashboard/favorites` generadas |

- **Tamaño real:** ~2.5k líneas autoradas vs `main` (incluye 5 archivos de test nuevos y
  el feature doc). Supera el forecast de ~900–1300: los tests RTL de páginas server y el
  read path hexagonal suman más de lo previsto. Heurística advisory: no se recorta código.

## Acceptance criteria

- [x] Las tres rutas compilan y se prerenderizan (verificado en `pnpm build`).
- [x] Score explicado en los dos formatos admitidos: `"Tienes X de Y ingredientes"`
  (tarjeta, REQ-05) y `"92% de coincidencia"` (detalle) — cubierto por tests.
- [ ] Casos 4 y 6 verificados end-to-end: los E2E 7–10 de spec 16 quedan **pendientes de
  datos sembrados** en Supabase (no ejecutables en este entorno, igual que spec 13).
- [x] Filtros de cocina y meal type aplicados sobre resultados reales (`FindRecipesFromPantry`).
- [x] Estados vacío/carga/error presentes en las tres vistas (tests por vista).

## Next step

- **Pendiente (no bloqueante):** E2E 7–10 de spec 16 requieren Supabase sembrado.
- Push / PR / merge: decisión del usuario (estrategia `ask-on-risk`; la consulta de cadena
  se difiere a la creación de PR).

## Log

**L1 (pedido original del usuario, verbatim):**

> @docs/specs/14-frontend-recipes-favorites/ implementa esta spec

**L2 (decisión del usuario, verbatim):** respuesta a la pregunta «¿Dónde deben vivir
los resultados de "Encontrar recetas"?» → **«Mover a /dashboard/recipes
(Recomendado)»**.

**L3 (evidencia de implementación y verificación):** implementación completada inline.
`pnpm lint` limpio, `pnpm typecheck` limpio, `pnpm test` 310/310, `pnpm build` OK.
Read path de ingredientes (T2) y Server Actions (T4) añadidos; las tres rutas nuevas
cubiertas por tests RTL. E2E 7–10 (spec 16) quedan pendientes de datos sembrados.
Commits de work-unit en `feat/14-recipes-favorites`.
