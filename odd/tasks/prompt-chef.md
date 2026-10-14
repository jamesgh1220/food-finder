# ODD — Prompt Chef en el dashboard (Gemini generativo desde texto libre)

## Objetivo

Añadir en `/dashboard` una sección con **pestañas** donde la pestaña activa por
defecto permite escribir una petición libre en español ("tengo tomate, huevos y
arroz; quiero un almuerzo rápido") y pulsar **Generar recetas**. Gemini responde
como chef, la receta se **renderiza inline** (ingredientes con cantidades,
preparación paso a paso, tiempo, porciones) y ofrece un botón para guardarla en
**favoritos**. La segunda pestaña conserva los controles actuales (tipo de
comida, cocina y **Encontrar recetas**).

Especificación maestra: `docs/PROMTP.md`. Skill visual obligatoria:
`minimalist-ui`.

## Problema / por qué

- El dashboard solo permite buscar por filtros; no hay forma de pedir una receta
  en lenguaje natural ni de guardarla.
- Los proveedores externos (Gemini) ya existen y generan recetas con cantidades
  y unidades, pero `RecipeRepository.save` persiste **solo la fila de la receta**,
  no las filas de ingredientes. Por eso la receta generada **no** debe
  redirigirse al detalle: se renderiza inline con el JSON ya validado.

## Alcance autorizado

- **Dentro:** puerto nuevo `ExternalRecipePromptProvider`; caso de uso
  `GenerateRecipeFromPrompt`; método `generateFromPrompt` en el adapter de Gemini
  (reutilizando cliente, schema Zod y mapper); wiring en la composition root;
  una Server Action `generateRecipeAction`; componentes de UI de pestañas y
  formulario; claves i18n; tests.
- **Fuera:** modificar el puerto `ExternalRecipeProvider` (los tests lo mockean
  con `satisfies`), persistir filas de ingredientes, cambiar el motor de
  recomendación, crear endpoints `/api/*`, llamar a Gemini desde el cliente.

## Restricciones / decisiones

- **Puerto nuevo, no modificar el existente.** `ExternalRecipeProvider` se
  mockea por forma en varios tests.
- **Server Action**, no Route Handler (patrón de `pantry`/`favorites`).
- **Degradación elegante:** sin API key o ante fallo, `generateFromPrompt`
  devuelve `null`; la UI muestra un error amable. Nunca lanza.
- **Cocina resoluble obligatoria:** la receta se descarta si su cocina no existe
  en el catálogo, así que el schema de la petición restringe `cuisine` al
  catálogo (`geminiResponseSchemaWithCuisines`).
- **Ambas pestañas montadas**, la inactiva oculta con `hidden`, para no perder el
  resultado generado al cambiar de pestaña.
- **`mealType`** sale de la respuesta de Gemini, no de un parámetro del usuario.
- Todo el copy en español vía `src/lib/i18n/messages.ts`; identificadores y
  comentarios en inglés.

## Tareas

- [x] **T1 — Puerto** `src/application/ports/external-recipe-prompt-provider.ts`
      (`ExternalRecipePromptInput`, `GeneratedRecipeIngredient`, `GeneratedRecipe`,
      `ExternalRecipePromptProvider.generateFromPrompt`).
- [x] **T2 — Caso de uso** `src/application/recipes/generate-recipe-from-prompt.ts`
      (`GenerateRecipeFromPrompt`): exige sesión, valida prompt no vacío y
      máx. 1000 caracteres, delega en el puerto.
- [x] **T3 — Schema** variante con cocina restringida al catálogo
      (`geminiResponseSchemaWithCuisines`) sin alterar `geminiResponseSchema`.
- [x] **T4 — Adapter** `generateFromPrompt` en `gemini-recipe-provider.ts`:
      prompt de chef, validación Zod, resolución de cocina, `save`, mapeo a
      `GeneratedRecipe`. Extracto compartido `parseRecipes`.
- [x] **T5 — Composition** `externalPromptProvider` en `ApplicationDependencies`
      + `generateRecipeFromPrompt` en `ApplicationServices` + wiring server.
- [x] **T6 — Server Action** `src/app/dashboard/actions.ts`
      (`generateRecipeAction`, resultado discriminado serializable).
- [x] **T7 — UI** `Textarea` primitivo, `DashboardTabs`, `PromptRecipeForm`,
      barrel y `dashboard/page.tsx`.
- [x] **T8 — i18n** sección `chef` en `messages.ts`.
- [x] **T9 — Tests** caso de uso, adapter (`generateFromPrompt`), formulario y
      actualización de `composition.test.ts`, `dashboard-page.test.tsx` y
      `client-boundary.test.ts`.
- [x] **T10 — Verificación** `pnpm lint && pnpm typecheck && pnpm test`.

## Ruta de implementación

- **Ruta:** direct inline. La delegación vía `task` no está disponible en este
  runtime (`OpenCode's free tier can only be used from within OpenCode.`), así
  que el orquestador ejecuta inline. Disparadores: el mapeo previo alcanzó el
  umbral de 4+ archivos (sin delegación posible), y la escritura toca 2+ archivos
  no triviales (sin delegación posible).

## Verificación

`pnpm lint && pnpm typecheck && pnpm test`. No hay test contra la API real de
Gemini: se usan clientes/repositorios falsos (patrón ya existente en
`tests/unit/infrastructure/gemini/`).

### Evidencia (2026-10-14)

- Rama: `feat/dashboard-chef-prompt` (creada desde `main`).
- Ruta: direct inline (delegación `task` no disponible en el runtime).
- Verificación **por cada commit**, no solo en HEAD: `pnpm typecheck`, `pnpm lint`
  y `pnpm test` ejecutados en los 6 commits. Los 6 pasan en verde.
  - `95e42c0` → 51 archivos, 338 tests.
  - `25208f2` → 51 archivos, 344 tests.
  - `fbbdaa9` → 51 archivos, 344 tests.
  - `536ad04` → 52 archivos, 349 tests.
  - `531db23` → 52 archivos, 349 tests.
  - commit de documentación (HEAD) → 52 archivos, 349 tests.
- Tests nuevos: `tests/unit/application/generate-recipe-from-prompt.test.ts` (5),
  `tests/unit/components/prompt-recipe-form.test.tsx` (5) y 6 casos de
  `generateFromPrompt` en `gemini-recipe-provider.test.ts`.
- Tests actualizados: `composition.test.ts` (21 casos de uso),
  `dashboard-page.test.tsx` (pestaña de chef por defecto), `client-boundary.test.ts`
  (`dashboard-tabs.tsx` y `prompt-recipe-form.tsx` como cliente; `textarea.tsx`
  como server-safe).
- Sin pruebas contra la API real de Gemini: cliente y repositorios falsos.
- Harness de runtime: N/A — no hay runtime boundary propio más allá de la Server
  Action, cubierta por test de componente con la action mockeada.
- TDD estricto: no hay activación explícita en el proyecto; runner `pnpm test`.
- RDD: **activado** (`gentle-ai review mode status` → `on (decided by default)`,
  global y clone-local `unset`). Se ejecuta la preflight de revisión nativa sobre
  el rango de la rama; se corrigió una afirmación previa errónea de esta misma
  lista que lo daba por desactivado sin comprobarlo.

### Defecto detectado y corregido durante el cierre

El primer agrupamiento dejó el commit de la Server Action sin la sección `chef` de
`messages.ts`, así que ese commit **no compilaba** (`tsc` marcaba
`Property 'chef' does not exist`). Vitest no lo detectó porque no typechequea y
ningún test importaba `actions.ts` en ese punto: el fallo solo aparecía con
`pnpm typecheck`. Se rehizo el agrupamiento (la sección i18n viaja con la action
que la usa por primera vez) y se re-verificó cada commit con los tres comandos.
Lección: **typecheck por commit**, no solo en HEAD.

### Slices listos para PR (presupuesto 400 líneas)

| # | Commit | Contenido | Líneas |
|---|--------|-----------|--------|
| 1 | `95e42c0` | puerto + caso de uso + test | 218 |
| 2 | `25208f2` | schema con cocina acotada + adapter Gemini + tests | 452 |
| 3 | `fbbdaa9` | composition + Server Action + i18n `chef` + test | 97 |
| 4 | `536ad04` | `Textarea` + `PromptRecipeForm` + test | 377 |
| 5 | `531db23` | `DashboardTabs` + page + boundary/page tests | 186 |
| 6 | documentación (HEAD) | este documento | 109 |

Total ~1439 líneas autoradas. El slice 2 excede el presupuesto en ~13% y se
mantiene unido a propósito: el schema y su único consumidor forman una sola
unidad coherente (el schema por separado es código muerto), así que si se abre PR
necesita `size:exception` sobre ese slice.

- Estrategia de entrega: `ask-on-risk` (por defecto). **Pendiente de decisión:**
  `stacked-to-main` vs `feature-branch-chain` cuando se abra el PR.
- Pendiente: prueba manual con `GEMINI_API_KEY` real.
- Pendiente (requiere autorización, fuera de alcance): decidir si una receta
  generada debe persistir también sus filas de ingredientes — mientras no lo haga,
  su detalle en `/dashboard/recipes/[id]` aparecerá sin ingredientes.
