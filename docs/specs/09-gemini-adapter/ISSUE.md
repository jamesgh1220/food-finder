# ISSUE: 09 — Proveedor externo de recetas con IA (Gemini)

## Título

Integrar Gemini tras el puerto ExternalRecipeProvider como fuente externa generativa, con validación por schema, persistencia y manejo de fallos graceful

## Descripción

Gemini es la fuente externa complementaria del MVP: genera recetas en español a partir de los ingredientes del usuario. Debe quedar detrás de un puerto (`ExternalRecipeProvider`) con un adapter que maneje la API, timeout, reintentos, rate limiting y parsing; valide y mapee siempre la salida a modelos propios (nunca contenido crudo al frontend) y degrade con elegancia cuando falle — la app debe seguir funcionando con recetas internas.

**Nota de cambio:** reemplaza a Spoonacular (spec 09 original). Motivo: la capa gratis de Spoonacular (50 puntos/día) es insuficiente y la UI/recetas del producto son en español. El dominio ya soporta `source = AI_GENERATED`.

## Objetivo

Fuente externa disponible y desacoplada: recetas generadas combinables cuando funciona, fallback silencioso cuando no, cero acoplamiento del dominio a Gemini.

## Alcance

- Puerto `ExternalRecipeProvider` (`searchByIngredients`).
- Adapter `GeminiRecipeProvider` en `src/infrastructure/gemini/` (client, schemas, providers).
- Verificación de modelo/API contra la documentación actual (#28, #95).
- Pipeline `Respuesta Gemini → Zod → Mapper → Domain model` (#29).
- `Recipe.source = AI_GENERATED` + persistencia de la receta generada (#30).
- Failure handling: timeout, 429/cuota, 5xx, caída, respuesta inválida (#32).
- API key solo server-side.

**Fuera de alcance:** flujo de recomendación/merge/dedup (spec 10), rate limiting de nuestra API (spec 11), tests con mock (spec 16).

## Casos de prueba

1. Éxito: `searchByIngredients` retorna recetas generadas, validadas y mapeadas a modelos propios.
2. Timeout: el proveedor no responde → el caso de uso continúa con resultados internos.
3. 429/cuota: rate limit o cuota agotada → fallback a internos, sin error técnico visible.
4. 5xx / respuesta inválida / JSON malformado → fallback controlado.
5. Receta que no valida contra el schema (campos faltantes, cantidades no numéricas) → descartada, sin excepción.
6. Resultado vacío → lista vacía manejada, no excepción.
7. La app funciona con `GEMINI_API_KEY` ausente (solo resultados internos).
8. Ningún campo de la respuesta cruda de Gemini aparece fuera del directorio del adapter.
9. Una receta generada persistida se puede ver en detalle y guardar como favorito.

## Consideraciones técnicas

- Consultar docs actuales ANTES de implementar: modelos, parámetros y límites pueden cambiar (#95).
- El mensaje de fallback al usuario es copy de UI localizable, no string técnico (#32).
- Reintentos solo cuando sean apropiados (idempotentes, con backoff); no reintentar indefinidamente.
- Timeouts siempre presentes: una llamada colgada no debe colgar la request (spec 04).
- El modelo puede alucinar cantidades o pasos inseguros: el schema valida la estructura y el prompt fija idioma + seguridad alimentaria; el contenido válido por schema sigue siendo generado, no verificado por un humano — se documenta esa limitación en la UI/README.

## Criterios de aceptación

- [x] Puerto + adapter completos, inyectados por DI, reemplazables por mock. *(puerto en `src/application/ports/external-recipe-provider.ts`; adapter `createGeminiRecipeProvider` en `src/infrastructure/gemini/providers/`; inyectado en `src/lib/composition/server-application.ts`. Reemplazo por mock cubierto por los tests unitarios)*
- [x] Pipeline de validación/mapeo respetado; cero contenido crudo hacia la aplicación. *(grep confirma que `responseSchema`, `candidates[0]` y `generativelanguage` solo aparecen dentro de `src/infrastructure/gemini/`)*
- [x] Los 9 casos de prueba en verde (mockeados). *(4 archivos en `tests/unit/infrastructure/gemini/`; el mapeo caso→test está en el registro de abajo)*
- [x] Modelo/API verificados contra documentación oficial actual y anotados en el PR. *(verificado el 2026-10-09 contra docs oficiales; **no hay PR** en este workflow — la referencia quedó en `odd/tasks/09-gemini-adapter.md` y en el registro de abajo)*
- [x] Clave nunca expuesta al cliente. *(`GEMINI_API_KEY` solo-servidor en `.env.example`; no existe `NEXT_PUBLIC_GEMINI_API_KEY`)*
- [x] Receta generada persistida accesible por `[id]` y como favorito. *(`RecipeRepository.save` + `source = AI_GENERATED` con `id` estable; `/dashboard/recipes/[id]` y favoritos leen de la BD)*

## Resultado esperado

Gemini integrado como fuente complementaria resiliente: suma recetas generadas en español cuando está sano y desaparece con elegancia cuando no, sin romper jamás la experiencia principal.

## Evidencia de implementación (implementado 2026-10-09 · registrado 2026-10-13)

**Estado:** completada (verificación unitaria con client HTTP falso).

**Commits:** `07cc173` `feat(gemini): implement recipe generation adapter and persistence` · `a163831` `fix(gemini): persist generated recipes`.

- **Puerto y adapter:** `ExternalRecipeProvider#searchByIngredients` en `src/application/ports/external-recipe-provider.ts`; `createGeminiRecipeProvider` en `src/infrastructure/gemini/providers/gemini-recipe-provider.ts`, con `client/`, `schemas/` y `providers/` bajo `src/infrastructure/gemini/`.
- **Client:** `fetch` nativo + `AbortController` para timeout, reintentos con backoff solo en 429/5xx/red, y clasificación de errores (`timeout`, `rate_limited`, `quota_exceeded`, `http_5xx`, `invalid_response`, `network`). No se agregó el SDK de Google (dependencia nueva evitada).
- **Pipeline:** `Respuesta Gemini → Zod → Mapper → Domain model`. El schema (`schemas/gemini-recipe-schema.ts`) rechaza campos faltantes, cantidades no numéricas y pasos vacíos; lo inválido se descarta sin excepción.
- **Gap de dominio resuelto:** `RecipeRepository.save` se extendió en el puerto (`src/domain/ports/recipe-repository.ts`) con implementación Supabase y mapper entidad→fila. Las recetas generadas se persisten con `source = AI_GENERATED` y `source_url` nulo, de modo que tienen `id` estable.
- **Wiring:** `createGeminiRecipeProvider` se inyecta en `src/lib/composition/server-application.ts` (spec 11); sin `GEMINI_API_KEY` el provider degrada sin tocar la red.
- **Modelo/API (REQ-05):** verificado el 2026-10-09 contra `ai.google.dev/gemini-api/docs/models`, `/structured-output` y `/pricing`: `generateContent` v1beta REST con `responseMimeType: "application/json"` + `responseSchema`; modelo por defecto `gemini-3.5-flash-lite` con override por `GEMINI_MODEL`.
- **Mapeo de los 9 casos de prueba a tests:** 1→“mapea recetas válidas a entidades de dominio”; 2→“clasifica un AbortError como timeout”; 3→“clasifica HTTP 429 como `rate_limited`” + “clasifica `RESOURCE_EXHAUSTED` como `quota_exceeded`”; 4→“reintenta HTTP 5xx y termina en `http_5xx`” + “clasifica un texto de candidato no-JSON como `invalid_response`”; 5→“devuelve `[]` sin lanzar cuando el contenido no valida el schema” + “descarta recetas individuales inválidas sin tumbar las válidas”; 6→“devuelve `[]` cuando la lista de recetas viene vacía”; 7→“devuelve `[]` sin tocar la red cuando no hay API key ni cliente”; 8→grep de confinamiento dentro de `src/infrastructure/gemini/`; 9→`RecipeRepository.save` + tests de reutilización de receta generada persistida.
- **Verificación observada (2026-10-09):** `pnpm test` PASS — 24 archivos / 161 tests; `pnpm lint` PASS; `pnpm typecheck` PASS.
- **Pendiente honesto:** la verificación es unitaria con el client HTTP falso. La prueba manual de corte de red / key ausente contra Gemini real, y los flujos E2E de recetas generadas, pertenecen a la spec 16. El contenido generado se valida estructuralmente por schema, **no** por revisión humana: la limitación debe reflejarse en la UI/README (spec 17).
