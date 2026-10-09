# ODD — Spec 09: Proveedor externo generativo (Gemini)

## Objetivo

Integrar Gemini como proveedor externo complementario que **genera** recetas en español a partir de los ingredientes disponibles, detrás del puerto `ExternalRecipeProvider`: client con timeout/retries/rate-limit awareness, validación Zod de la salida, mapeo a modelos propios y fallo elegante (nunca single point of failure).

Especificación: `docs/specs/09-gemini-adapter/SPEC.md` + `ISSUE.md`.
Rama: `feat/09-gemini-adapter`.

## Alcance autorizado

- **Dentro:** puerto `ExternalRecipeProvider` (`searchByIngredients`); adapter `GeminiRecipeProvider` bajo `src/infrastructure/gemini/` con `client/`, `schemas/`, `providers/`; prompt + schema Zod; verificación de modelo/API contra docs actuales; pipeline `Gemini → Zod → Mapper → Domain model`; persistencia de recetas generadas `source = AI_GENERATED` con ID estable vía `RecipeRepository.save` (REQ-07); manejo de fallos (timeout / 429 / cuota / 5xx / JSON malformado / contenido inválido) sin exposición técnica; API key solo servidor (`GEMINI_API_KEY`).
- **Fuera:** orquestación recomendación/dedup/merge (spec 10), rate limiting API (spec 11), UI (specs 12–14), `MockExternalRecipeProvider` completo de spec 16 (aquí solo el falso mínimo que necesitan los unit tests), seed (spec 15).

## Contexto técnico relevante (verificado 2026-10-09)

- **Modelo/API (REQ-05, docs oficiales):** Gemini API v1beta REST `generateContent` con `generationConfig.responseMimeType = "application/json"` + `responseSchema` (JSON Schema) para salida estructurada. Modelo recomendado vigente para proyectos nuevos: `gemini-3.5-flash-lite` (recomendado por Google para proyectos nuevos; estructura de salida soportada; capa gratis con tokens gratis) o `gemini-3.8-flash` (GA, producción). Se usa `gemini-3.5-flash-lite` por defecto con override por variable de entorno `GEMINI_MODEL`. Fuentes: ai.google.dev/gemini-api/docs/models, /structured-output, /pricing (verificado 2026-10-09).
- **Sin SDK de Google:** el proyecto no tiene `@google/genai`; el client usa `fetch` nativo (Node 18+/Next server) con `AbortController` para timeout, evitando una dependencia nueva. Alternativa SDK documentada en el PR como futura.
- **Gap detectado en dominio:** `RecipeRepository` (spec 06/08) NO tiene `save` — solo lecturas. REQ-07 exige persistir recetas generadas → extender `RecipeRepository` con `save(recipe: Recipe): Promise<Recipe>` + implementación Supabase + mapper entidad→fila (`toRecipeRow`).
- **Cuisine obligatoria:** la entidad `Recipe` exige `cuisineId` y el row-mapper lanza `RepositoryError` si `cuisine_id` es null. Las recetas generadas deben resolver `cuisineId` del catálogo (por nombre desde la respuesta Gemini o desde el input opcional `cuisine`) o descartarse como inválidas.
- **Convenciones:** comentarios en español, identificadores/commits en inglés, pnpm, capa aplicación/dominio puras (eslint prohíbe imports a `@/infrastructure/*`), barriles en `index.ts`, fábricas `create*`.

## Entregables / tareas

- [ ] **T1 — Puerto `ExternalRecipeProvider`**: `searchByIngredients(...)` sin `getRecipeById` (REQ-01). El input incluye ingredientes + `mealType` + `cuisine?` + `maxPreparationTime?` (REQ-11); retorna recetas mapeadas a modelos propios (nunca la respuesta cruda). Ubicación: dominio (puerto puro) dado que el flujo lo consume la capa de aplicación (spec 10) y el dominio no debe conocer Gemini; REQ-09 reemplazable por mock.
- [x] **T2 — `RecipeRepository.save`**: extender puerto dominio + implementación `createSupabaseRecipeRepository` (insert con select single) + `toRecipeRow` en `src/infrastructure/supabase/mappers/recipe-mapper.ts` + export en barril. La fila persiste `source = AI_GENERATED`, `source_url = null` o marcador IA (REQ-07). El provider busca por slug, reutiliza únicamente recetas IA existentes, persiste las nuevas y retorna la entidad guardada con su ID estable; colisiones con recetas no IA se omiten.
- [ ] **T3 — Client Gemini**: `src/infrastructure/gemini/client/gemini-client.ts` — `createGeminiClient({apiKey, baseUrl, model, timeoutMs, maxRetries})` con fetch, `AbortController` timeout (REQ-03), retries con backoff solo en 429/5xx/red, clasificación de errores (`rate_limited`, `quota_exceeded`, `timeout`, `http_5xx`, `invalid_response`, `network`), parsing de `candidates[0].content.parts[0].text` como JSON. Sin API key → provider degrada sin llamar.
- [ ] **T4 — Schema Zod**: `src/infrastructure/gemini/schemas/recipe-schema.ts` — schema de la respuesta Gemini (lista de recetas con `name`, `description`, `cuisine`, `mealType`, `ingredients[]` con `name`/`quantity`/`unit`, `instructions[]` no vacío, `preparationTimeMinutes`, `servings`, `difficulty`). Rechaza campos faltantes, cantidades no numéricas, pasos vacíos (REQ-10). También `toGeminiResponseSchema()` que derive el JSON Schema para `responseSchema` de la API.
- [ ] **T5 — Mapper**: `src/infrastructure/gemini/providers/gemini-recipe-mapper.ts` — `mapGeminiRecipeToDomain(...)` → entidad `Recipe` con `source = AI_GENERATED`, `sourceUrl = null`, `cuisineId` resuelto (cuisine sugerida por Gemini → catálogo, con fallback a `cuisineId` del input; si no resuelve → receta descartada/inválida), `slug` generado del nombre, timestamps `new Date()`.
- [ ] **T6 — Provider**: `src/infrastructure/gemini/providers/gemini-recipe-provider.ts` — `createGeminiRecipeProvider({client, cuisineRepository, recipeRepository, logger})` implementando `ExternalRecipeProvider`. Construye prompt (español, JSON, seguridad alimentaria — REQ-10), llama al client, valida con Zod (REQ-06), descarta lo inválido sin excepción (REQ-10), mapea y persiste mediante `RecipeRepository.save` (REQ-07). Todos los fallos externos se degradan: `ExternalServiceError` controlado en la frontera o lista vacía, nunca error crudo al usuario (REQ-08). Sin key → todos los casos devuelven lista vacía (degrada).
- [ ] **T7 — Barril + composición**: `src/infrastructure/gemini/index.ts` reexporta fábricas/tipos. `.env.example`: `GEMINI_API_KEY` (server-only, nunca `NEXT_PUBLIC_GEMINI_API_KEY`), `GEMINI_MODEL`, `GEMINI_BASE_URL`, `GEMINI_TIMEOUT_MS` opcional (REQ-04). Nota: no se cablea en `createApp`/composition root todavía (consumidor es spec 10); se expone la fábrica para inyección DI (REQ-09).
- [x] **T8 — Unit tests**: `tests/unit/infrastructure/gemini/` — falsos mínimos del client/HTTP (sin API real; REQ-09 + ISSUE casos 1–7): éxito, timeout, 429/cuota, 5xx, JSON malformado, respuesta no conforme (schema), resultado vacío, sin API key. Tests de `recipe-mapper` para `toRecipeRow` / `save` (T2). pnpm lint + typecheck + test.
- [ ] **T9 — Evidencia spec + ODD**: sección "Evidencia (fecha)" en SPEC.md con modelo/endpoints verificados (REQ-05), decisión de `save`, límites gratis, y estado; actualizar ISUJE/README si aplica (el rename Spoonacular→Gemini ya está en docs; verificar `.env.example`).

## Estado

En curso — rama `feat/09-gemini-adapter` creada; base `main` f38d768. Cambios previos de rename en docs viajan en la rama.

## Verificación

`pnpm lint && pnpm typecheck && pnpm test` — sin tests contra Gemini real (spec 16: `MockExternalRecipeProvider`). Prueba manual de corte de red/key ausente queda anotada en la spec.

### Evidencia de cierre parcial — REQ-07 (2026-10-09)

- Ruta: delegated direct; brecha encontrada en auditoría: el provider mapeaba recetas pero no las persistía.
- Work-unit commit: `a163831` (`fix(gemini): persist generated recipes`).
- `pnpm test`: PASS — 24 archivos, 161 tests.
- `pnpm lint`: PASS.
- `pnpm typecheck`: PASS.
- Verificación independiente: PASS para propagación de ID estable, reutilización de IA existente, manejo de slug en colisión y aislamiento de fallos por receta.
- `gentle-ai review assess`: no evaluable por archivos untracked del worktree; RDD está desactivado localmente. No se inició una revisión nativa.
- TDD estricto: desactivado/no existe activación explícita; runner del proyecto: `pnpm test`.
- Siguiente: revisar el resto de REQ-01–06 y REQ-08–11; completar T9/evidencia de spec antes de cerrar la feature.
