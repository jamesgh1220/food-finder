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

- [ ] Puerto + adapter completos, inyectados por DI, reemplazables por mock.
- [ ] Pipeline de validación/mapeo respetado; cero contenido crudo hacia la aplicación.
- [ ] Los 9 casos de prueba en verde (mockeados).
- [ ] Modelo/API verificados contra documentación oficial actual y anotados en el PR.
- [ ] Clave nunca expuesta al cliente.
- [ ] Receta generada persistida accesible por `[id]` y como favorito.

## Resultado esperado

Gemini integrado como fuente complementaria resiliente: suma recetas generadas en español cuando está sano y desaparece con elegancia cuando no, sin romper jamás la experiencia principal.
