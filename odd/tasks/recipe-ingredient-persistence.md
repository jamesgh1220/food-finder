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

- [x] **T1** — Tipo de entrada `RecipeIngredientInput` (dominio) + firma del puerto `RecipeRepository.save(recipe, ingredients)`; RED primero. (S1,S2,S3) · inline · `00043ba`
  - RED observado: 2 fallos (`expected undefined to deeply equal [...]`, `ingredientWrites` vacío). GREEN: 29/29 en `supabase-repositories.test.ts`.
- [x] **T2** — Implementación Supabase: resolución/creación de ingredientes con el mismo cliente, deduplicación, inserción de filas después de la receta, degradación con `warn`. (S1–S5,S7) · inline · `00043ba`
  - El segundo argumento es **obligatorio** (sin default): olvidarlo es un error ruidoso, no una degradación silenciosa. Se actualizaron los 5 call sites del test.
- [x] **T3** — Provisto de Gemini: `persistRecipe` propaga los ingredientes en los dos flujos (chef y filtros). (S1,S8) · inline · `00043ba`
  - RED observado en ambos flujos (`Number of calls: 1` con el argumento esperado ausente). GREEN: 50/50 en los dos archivos tocados.
- [x] **T4** — Actualizar `docs/specs/09-gemini-adapter/SPEC.md` (REQ-07) y `docs/specs/14-frontend-recipes-favorites/` si corresponde. (S6) · inline · `485da03`
  - Se actualizó además `docs/specs/04-security-rls/SPEC.md` (REQ-04): era la excepción real de escritura al catálogo global.
- [x] **T5** — Sonda contra la base real: generar/insertar una receta con ingredientes, verificar filas y limpiar. (S1,S2) · inline · sin artefacto (sonda temporal, borrada)
  - Evidencia: `1 passed` con el repo real + cliente real + RLS real. `anon insert ingredients → 42501`; `findIngredients` devolvió 2 filas (el duplicado normalizado colapsó, S3) con `quantity/unit/optional` correctos; el catálogo quedó con 2 filas nuevas. Post-check independiente: 0 ingredientes y 0 recetas de sonda sobrantes.
- [x] **T6** — Verificación independiente (riesgo alto: escritura en catálogo global con service-role). · delegated · — **asumida por el usuario (2026-10-17)**
  - El agente **no** la ejecutó: el runtime de subagentes devolvió `This API key has expired` y OpenCode quedó caído. Por decisión explícita del usuario (L4), la verificación independiente queda **a cargo del usuario**. No hay veredicto del agente para T6.
- [x] **T7** — Cierre del documento con evidencia. · inline · (este commit)

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

**Presupuesto de entrega — corregido (2026-10-14).** Pronóstico ~320 líneas autoradas; **real: 456** (437 altas + 19 bajas, sin generados). Supera el umbral de ~400, así que la estrategia `ask-on-risk` exige decidir el encadenado antes del próximo commit/PR. Recomendación: **un solo PR**, porque las tres capas deben moverse juntas para que el repo compile (el proveedor no puede llamar a `save` con la firma vieja mientras el puerto ya exige el segundo argumento); partirlo en dos dejaría el primer slice sin `typecheck`. Queda a decisión del usuario.

**L3 (2026-10-14) — corrección de un diagnóstico falso.** En la sesión anterior informé que `src/domain/ports/recipe-repository.ts` tenía un comentario basura commiteado (`Manages the persistence layer` ×3, 44 líneas, commit `8d4cea2`). **Era falso.** El render de salida de esa sesión estaba degradado e *inventaba* contenido, no solo lo duplicaba; los números (`44`, `manages=3`) también eran fabricados. El archivo real tiene 39 líneas, está limpio, y el "defecto preexistente" no existe en ningún commit. Se descartó la tarea de limpieza que se había planeado a partir de ese diagnóstico.

**Evidencia de implementación (2026-10-14).** RED observado antes de cada GREEN: 2 fallos en `supabase-repositories.test.ts`, 2 fallos en `gemini-recipe-provider.test.ts`. Suite completa: **358 passed / 52 archivos** (antes 352 → +6 tests). `pnpm typecheck` y `pnpm lint` limpios. Dos work-unit commits: `00043ba` (código + tests) y `485da03` (specs + doc).

**Hallazgo operativo (2026-10-14).** La base real ya tenía **3 recetas `AI_GENERATED`** de pruebas anteriores del usuario (`pollo-agridulce-con-papa-criolla-y-arroz`, `arroz-con-huevo-a-la-criolla`, `atun-encebollado-a-la-espanola`) con **0 filas** de `recipe_ingredients`. Este fix **no las repara**: sus ingredientes nunca se guardaron en ningún lado y son irrecuperables. Solo aplica a generaciones nuevas. Total de filas en `recipe_ingredients` hoy: 229 (todas de recetas internas).

**Sesión 2026-10-17 — estado y bloqueo de T6.** `main` ya contiene los tres commits (`00043ba`, `485da03` y `161efa0 feat: md actualoizado`, este último del usuario, commiteado encima); la rama `feat/recipe-ingredient-persistence` quedó congelada en `485da03`. `main` está **2 commits adelante de `origin/main`: nada pusheado**. Árbol limpio. Re-verificado en HEAD: `pnpm typecheck` y `pnpm lint` limpios, **358 passed / 52 archivos**.

**T6 sigue bloqueada.** El verificador independiente no arrancó: el runtime de subagentes devolvió `This API key has expired. Create a new API key in OpenCode Console...`. Es una credencial vencida del runtime — no un defecto del código, del cambio ni de Gentle AI. Además, el render de salida de esta sesión volvió a duplicar líneas (por eso los chequeos se re-ejecutaron con comandos chicos y acotados).

**Auto-revisión (2026-10-17) — NO es T6.** Chequeos mecánicos del repaso adversarial que se quiso delegar: (a) `save` con los dos argumentos en el único call site productivo (`gemini-recipe-provider.ts:265`) y en los 4 fakes de test; (b) corte RLS/admin intacto (`recipes` → `clients.client` RLS; `recipeWriter` → `adminClient`, `repositories/index.ts:71,75`); (c) el `logger` real llega al escritor (`server-application.ts:12,23` → `repositories/index.ts:77`), así que el `warn` de degradación **sí** se emite en producción y no queda `undefined`; (d) ningún Client Component (17 en total) importa el cliente admin ni la composition de servidor; (e) la deduplicación es por `ingredient_id` resuelto, así que dos nombres que normalizan igual colapsan; (f) no se escriben filas de join si falla el insert de la receta. Sin bloqueantes nuevos. **Aporta evidencia, no independencia: T6 hay que correrla igual cuando la credencial esté sana.**

**L4 (2026-10-17, verbatim):** "esta caido opendode entonces la revision la hago yo, deja asi"

**Cierre (2026-10-17).** T6 queda **asumida por el usuario**: OpenCode está caído y él hace la verificación independiente por su cuenta. El agente no la ejecutó ni emite veredicto sobre ella. Tareas T1–T5 cerradas con evidencia propia; T7 cerrado con este documento. **Sin pushear**: `main` sigue 2 commits adelante de `origin/main`. La decisión de entrega (un solo PR vs. encadenado — recomendación registrada: un solo PR) queda pendiente a criterio del usuario.
