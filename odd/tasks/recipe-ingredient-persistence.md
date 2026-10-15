# ODD — Persistencia de ingredientes en recetas generadas por IA

Objetivo: que una receta generada por el chef guarde sus filas de `recipe_ingredients` para que su detalle muestre los ingredientes reales.
Rama: `feat/recipe-ingredient-persistence` (desde `main`). Estrategia de entrega: `ask-on-risk`. Runner: `pnpm test` (TDD: RED → GREEN → REFACTOR).

Cierra el pendiente explícito de `odd/tasks/prompt-chef.md`: "decidir si una receta generada debe persistir también sus filas de ingredientes".

## Specs

- **S1 — Persistencia.** Al persistir una receta generada por IA, sus ingredientes se guardan en `public.recipe_ingredients` con `quantity`, `unit` y `optional`. Columnas reales: `recipe_ingredients(id, recipe_id, ingredient_id, quantity, unit, notes, created_at)` (`001_initial_schema.sql:92`) más `optional BOOLEAN NOT NULL DEFAULT FALSE` (`003_recipe_ingredient_optionality.sql:3`).
- **S2 — Resolución contra el catálogo.** Cada ingrediente se resuelve por su nombre normalizado (`normalizeIngredientName`, `src/domain/normalization/ingredient-normalizer.ts:32`) contra `public.ingredients`: si existe se **reutiliza**, si no existe se **crea** una fila nueva.
  - **Decisión de producto (explícita, autorizada por el usuario):** el flujo de IA puede crear ingredientes en el catálogo global. Es la única vía posible: `recipe_ingredients.ingredient_id` es `NOT NULL REFERENCES ingredients(id)` (`001_initial_schema.sql:95`), así que sin fila de catálogo no hay forma de guardar el ingrediente.
  - `IngredientRepository.save` hace upsert **por PK (`id`)**, no por nombre: no hay UNIQUE sobre `normalized_name`, y su comentario delega la deduplicación por nombre al llamador (`supabase-ingredient-repository.ts:76-79`). Por eso la resolución es: `findByNormalizedNames` → crear los faltantes.
- **S3 — Deduplicación dentro de una receta.** Dos ingredientes de la misma receta que resuelvan al mismo `ingredient_id` se colapsan en una sola fila, respetando `idx_recipe_ingredient_unique` sobre `(recipe_id, ingredient_id)` (`001_initial_schema.sql:104`). Gana el primero.
- **S4 — Orden y ausencia de huérfanos.** Orden estricto: resolver/crear ingredientes → insertar la receta → insertar las filas de `recipe_ingredients`. Si el insert de la receta falla, **no** se escriben filas de ingredientes.
- **S5 — Degradación.** Si falla la persistencia de los ingredientes, la receta **igual** se devuelve al usuario (el chef nunca pierde la receta) y se registra un `warn`. `generateFromPrompt` nunca lanza.
- **S6 — Detalle.** Abrir el detalle de una receta generada muestra la sección con el heading `messages.recipeDetail.ingredients` ("Ingredientes") y las filas reales, y **no** el placeholder `messages.recipeDetail.noIngredients` ("No tenemos el detalle de los ingredientes de esta receta."). Ambos strings son los vigentes en `src/lib/i18n/messages.ts:185,192-193`.
- **S7 — Privilegio y servidor.** Las escrituras a `ingredients` y `recipe_ingredients` ocurren server-only y por el cliente admin. Ni `ingredients` ni `recipe_ingredients` tienen policy de INSERT: `002_rls_policies.sql:115,132` solo definen `*_select_authenticated`. Se mantiene el corte RLS/admin ya establecido.
- **S8 — Sin regresión.** El repositorio `recipes` de cara al usuario sigue atado al cliente RLS; el flujo de filtros (`searchByIngredients`) y el del chef comparten la misma ruta de persistencia.

Fuera de alcance: el puntaje de coincidencia del detalle (`RecipeMatchScore`). Depende de que la receta aparezca en los resultados del motor de recomendación, que vuelve a consultar al proveedor externo; hacerlo confiable es otra decisión y otro work unit.

## Tasks

- [ ] **T1** — Tipo de entrada `RecipeIngredientInput` (dominio) + firma del puerto `RecipeRepository.save(recipe, ingredients)`; RED primero. (S1,S2,S3) · inline · —
- [ ] **T2** — Implementación Supabase: resolución/creación de ingredientes con el mismo cliente, deduplicación, inserción de filas después de la receta, degradación con `warn`. (S1–S5,S7) · inline · —
- [ ] **T3** — Provisto de Gemini: `persistRecipe` propaga los ingredientes en los dos flujos (chef y filtros). (S1,S8) · inline · —
- [ ] **T4** — Actualizar `docs/specs/09-gemini-adapter/SPEC.md` (REQ-07) y `docs/specs/14-frontend-recipes-favorites/` si corresponde. (S6) · inline · —
- [ ] **T5** — Sonda contra la base real: generar/insertar una receta con ingredientes, verificar filas y limpiar. (S1,S2) · inline · —
- [ ] **T6** — Verificación independiente (riesgo alto: escritura en catálogo global con service-role). · delegated · —
- [ ] **T7** — Cierre del documento con evidencia. · inline · —

## Log

**L1 (2026-10-14, verbatim):** "implementa la opcion A si es tu recomendacion"

**L2 (contexto, opción A tal como se presentó al usuario):** "**A. Persistir ingredientes completo** — Detalle consistente, match score funcional. Costo: Alto: puerto + get-or-create + decisión de catálogo + tests."

**Análisis (2026-10-14).** Elección de A y no C: sin filas en `recipe_ingredients` el motor de coincidencia no puede puntuar la receta, y el §72 del master spec exige explicar la coincidencia ("Tienes 5 de 6 ingredientes"). Sin ingredientes, la receta del chef queda como ciudadana de segunda dentro del propio producto.

**Hallazgos del mapeo previo.**
- `recipe_ingredients.optional` sí existe (migración 003), así que el dato de opcionalidad que ya devuelve Gemini es persistible sin migración.
- `IngredientRepository` ya expone `findByNormalizedNames` y `save` (upsert): **no hace falta un puerto nuevo** para el catálogo.
- `RecipeRepository.save` tiene **un solo consumidor** en producción (`gemini-recipe-provider.ts:260`), así que extender su firma no rompe otros flujos.
- Ninguna de las dos tablas tiene policy de INSERT → la escritura necesita el cliente admin, igual que el fix anterior. El escritor admin y el repositorio de ingredientes comparten cliente, así que no hace falta wiring nuevo en la composition root.

**Decisión de diseño.** La resolución/creación de ingredientes vive dentro de la implementación Supabase de `RecipeRepository`, usando un `IngredientRepository` construido sobre el **mismo cliente** (parámetro por defecto). Razón: persistir una receta con sus ingredientes es una sola operación de agregado; dejarla en el adapter repartiría orquestación de dominio fuera de su capa, y crear un caso de uso anidado para esto sería sobreingeniería.

**Riesgo declarado.** Crear filas en el catálogo global `ingredients` a partir de nombres inventados por un modelo. Acotado: solo se crea lo que no existe (clave: nombre normalizado) y es reversible borrando filas sin referencias. Carrera conocida: sin UNIQUE sobre `normalized_name`, dos requests concurrentes podrían crear el mismo ingrediente duplicado; se acepta y se registra como decisión aparte (candidato: índice UNIQUE en una migración futura).

**Presupuesto de entrega.** Pronóstico ~320 líneas autoradas (suma de altas y bajas, sin generados). Por debajo de ~400 → un solo PR; no hace falta encadenar.
