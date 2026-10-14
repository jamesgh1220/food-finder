# SPEC: 09 — Proveedor externo de recetas con IA (Gemini): puerto, adapter generativo, validación y manejo de fallos

**Fuente:** PROMTP.md #26 (Puerto externo), #27 (Adapter), #28 (Modelos/API), #29 (Mapping), #30 (Fuente de receta), #32 (Manejo de fallos), #95 (Verificar docs actuales).

> **Nota de cambio (2026-10-09):** La fuente externa del MVP deja de ser Spoonacular y pasa a ser **Gemini** (generación de recetas). Motivo: la capa gratis de Spoonacular (50 puntos/día ≈ ~15 búsquedas reales) es insuficiente como fuente viva, y la UI y las recetas del producto son en español. Gemini genera recetas en español a partir de los ingredientes disponibles y su capa gratis ofrece ~1.000 requests/día. El dominio ya contemplaba `source = AI_GENERATED`. Referencia de investigación en `engram` (proyecto `food-finder`).

## Propósito

Integrar Gemini como proveedor externo complementario que **genera** recetas en español a partir de los ingredientes disponibles, detrás del puerto `ExternalRecipeProvider`: client con timeout/retries/rate, validación de la salida con schema, mapeo a modelos propios y fallo elegante para que el proveedor externo **nunca sea un single point of failure**.

## Alcance

### Dentro del alcance
- Puerto `ExternalRecipeProvider` (obtención de recetas por ingredientes) + adapter `GeminiRecipeProvider` bajo `src/infrastructure/gemini/`.
- Prompt de generación + schema de validación (Zod) de la salida del modelo.
- Selección de modelo/API verificada contra la documentación actual de Gemini.
- Pipeline de validación y mapeo `Respuesta Gemini → Schema Zod → Mapper → Domain model`.
- Persistencia de las recetas generadas con `source = AI_GENERATED` (IDs estables para detalle y favoritos).
- Manejo de fallos (timeout / 429 / cuota / 5xx / JSON malformado / contenido inválido) con fallback a resultados internos.
- API key solo en servidor.

### Fuera del alcance
- Orquestación del flujo de recomendación/dedup/merge (spec 10), rate limiting de nuestra API (spec 11), tests con mock (spec 16), UI (specs 12–14).

## Requisitos

| ID | Requisito |
|----|-----------|
| REQ-01 | Definir el puerto `ExternalRecipeProvider` con al menos `searchByIngredients(...)`: una operación "dame recetas que coincidan con estos ingredientes", implementada por generación. El dominio no debe conocer Gemini. **No** se incluye `getRecipeById` en este puerto — las recetas generadas se persisten y se recuperan por el `RecipeRepository` interno (REQ-07). |
| REQ-02 | Adapter en `src/infrastructure/gemini/` con `client/`, `schemas/`, `providers/`; implementar `GeminiRecipeProvider`. |
| REQ-03 | Responsabilidades del client: base URL/SDK, API key, HTTP, **timeout**, reintentos cuando sean apropiados, clasificación de errores, conciencia de rate limiting (429 / `RESOURCE_EXHAUSTED`), parsing. |
| REQ-04 | API key `GEMINI_API_KEY` solo en servidor; nunca `NEXT_PUBLIC_GEMINI_API_KEY`. |
| REQ-05 | Antes de implementar, verificar la documentación actual de Gemini: modelo recomendado vigente, parámetros, salida estructurada (JSON) y límites de la capa gratis. Sin modelos/endpoints obsoletos. |
| REQ-06 | Pipeline obligatorio — nunca devolver contenido crudo del modelo al frontend: `Respuesta Gemini → Schema Zod → Mapper → Domain model → API Response`. La salida se solicita en JSON estructurado y se valida; si no valida, se descarta. |
| REQ-07 | Las recetas generadas llevan `source = AI_GENERATED` y se **persisten** vía `RecipeRepository` para tener un `id` estable (la página `[id]` y los favoritos leen de la BD). Sin `sourceUrl` real (o con un marcador de origen IA). |
| REQ-08 | Manejo de fallos: en timeout, 429/cuota excedida, 5xx, caída o respuesta inválida la aplicación **sigue funcionando**; si existen resultados internos, muéstralos; nunca exponer errores técnicos (sin "GeminiError 429…" para el usuario). Mensaje amigable p. ej. *"No pudimos generar recetas adicionales, pero encontramos estas opciones con tus ingredientes."* (copy de UI localizable — ver spec 12). |
| REQ-09 | `GeminiRecipeProvider` debe ser reemplazable en tests con `MockExternalRecipeProvider` (sin API real en tests unitarios — spec 16). |
| REQ-10 | **Seguridad y calidad del contenido generado:** el prompt fija idioma español, formato JSON y restricciones de seguridad alimentaria; el schema rechaza recetas con campos faltantes, cantidades no numéricas o pasos vacíos. Contenido inválido → descartado, nunca propagado. |
| REQ-11 | El input de generación incluye `mealType`, `cuisine` (opcional) y `maxPreparationTime` (opcional) para que la receta generada respete los filtros del producto. |

## Dependencias

- `06-domain-layer`, `02-architecture-foundation`, `01-project-scaffold` (env vars), `07-application-layer` (consumidores).

## Criterios de aceptación

- [x] La aplicación compila y funciona con la key de Gemini eliminada/proveedor caído: las recetas internas siguen retornando (sin crash, sin error crudo al usuario). *(sin `GEMINI_API_KEY` el provider devuelve `[]` sin tocar la red; `pnpm build` PASS)*
- [x] Ninguna forma de la respuesta cruda de Gemini aparece fuera de `src/infrastructure/gemini/`. *(grep: `responseSchema`, `candidates[0]`, `generativelanguage` solo dentro de ese directorio)*
- [x] Timeout aplicado en cada llamada externa. *(`AbortController` en `client/gemini-client.ts`; test “clasifica un AbortError como timeout”)*
- [x] Una receta generada que no valida contra el schema se descarta sin excepción. *(tests “devuelve `[]` sin lanzar cuando el contenido no valida el schema” y “descarta recetas individuales inválidas sin tumbar las válidas”)*
- [x] Una receta generada y persistida aparece en `/dashboard/recipes/[id]` y puede guardarse como favorito. *(`RecipeRepository.save` persiste con `source = AI_GENERATED` e `id` estable; la página de detalle y favoritos leen de la BD. El E2E con Gemini real queda en la spec 16)*
- [x] Modelo/API verificados contra la documentación oficial actual (referencia registrada en el PR). *(verificado el 2026-10-09 contra docs oficiales; **no hay PR** en este workflow — la referencia quedó en `odd/tasks/09-gemini-adapter.md`)*

## Verificación

Tests unitarios con un client HTTP falso (success, timeout, 429/cuota, 5xx, malformado, vacío, contenido inválido, sin API key) en `tests/unit/infrastructure/gemini/` + la prueba manual de corte de red y de key ausente contra Gemini real, que pertenece a la spec 16.

**Evidencia observada (2026-10-09):** `pnpm test` PASS — 24 archivos / 161 tests · `pnpm lint` PASS · `pnpm typecheck` PASS. El detalle y el mapeo caso→test están en el registro del `ISSUE.md`.
