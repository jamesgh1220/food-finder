# ISSUE: 09 — Adapter de Spoonacular

## Título

Integrar Spoonacular tras el puerto ExternalRecipeProvider con mapping obligatorio y manejo de fallos graceful

## Descripción

Spoonacular es la fuente externa complementaria del MVP. Debe quedar detrás de un puerto (`ExternalRecipeProvider`) con un adapter que maneje HTTP, timeout, reintentos, rate limiting y parsing; mapee siempre los DTOs externos a modelos propios (nunca JSON crudo al frontend) y degrade con elegancia cuando falle — la app debe seguir funcionando con recetas internas.

## Objetivo

Fuente externa disponible y desacoplada: resultados combinables cuando funciona, fallback silencioso cuando no, cero acoplamiento del dominio a Spoonacular.

## Alcance

- Puerto `ExternalRecipeProvider` (`searchByIngredients`, `getRecipeById`).
- Adapter `SpoonacularRecipeProvider` en `src/infrastructure/spoonacular/` (client, mappers, providers).
- Verificación de endpoints contra la documentación actual (#28, #95).
- Pipeline de mapeo DTO → dominio (#29).
- `Recipe.source = SPOONACULAR` (#30).
- Failure handling: 429, timeout, 500, caída, cuota, respuesta inválida (#32).
- API key solo server-side.

**Fuera de alcance:** flujo de recomendación/merge/dedup (spec 10), rate limiting de nuestra API (spec 11), tests con mock (spec 16).

## Casos de prueba

1. Éxito: `searchByIngredients` retorna recetas mapeadas a modelos propios.
2. Timeout: el proveedor no responde → el caso de uso continúa con resultados internos.
3. 429: rate limit externo → fallback a internos, sin error técnico visible.
4. 500 / respuesta inválida / JSON malformado → fallback controlado.
5. Resultado vacío → lista vacía manejada, no excepción.
6. La app funciona con `SPOONACULAR_API_KEY` ausente (solo resultados internos).
7. Ningún campo del JSON de Spoonacular aparece fuera del directorio del adapter.

## Consideraciones técnicas

- Consultar docs actuales ANTES de implementar: endpoints y límites pueden cambiar (#95).
- El mensaje de fallback al usuario es copy de UI localizable, no string técnico (#32).
- Reintentos solo cuando sean apropiados (idempotentes, con backoff); no reintentar indefinidamente.
- Timeouts siempre presentes: una llamada colgada no debe colgar la request (spec 04).

## Criterios de aceptación

- [ ] Puerto + adapter completos, inyectados por DI, reemplazables por mock.
- [ ] Pipeline de mapeo respetado; cero JSON crudo hacia la aplicación.
- [ ] Los 7 casos de prueba en verde (mockeados).
- [ ] Endpoints verificados contra documentación oficial actual y anotados en el PR.
- [ ] Clave nunca expuesta al cliente.

## Resultado esperado

Spoonacular integrado como fuente complementaria resiliente: suma resultados cuando está sano y desaparece con elegancia cuando no, sin romper jamás la experiencia principal.
