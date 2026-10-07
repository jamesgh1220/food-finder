# SPEC: 09 — Adapter de Spoonacular (puerto, client, mapping, manejo de fallos)

**Fuente:** PROMTP.md #26 (Puerto Spoonacular), #27 (Adapter), #28 (Endpoints), #29 (Mapping), #30 (Fuente de receta), #32 (Manejo de fallos), #95 (Verificar docs actuales).

## Propósito

Integrar Spoonacular como proveedor externo complementario de recetas detrás del puerto `ExternalRecipeProvider`: client HTTP con timeout/retries/rate, mapeo de DTOs y fallo elegante para que Spoonacular **nunca sea un single point of failure**.

## Alcance

### Dentro del alcance
- Puerto `ExternalRecipeProvider` + adapter `SpoonacularRecipeProvider` bajo `src/infrastructure/spoonacular/`.
- Selección de endpoints verificada contra la documentación actual de Spoonacular.
- Pipeline de mapeo DTO → dominio.
- Manejo de fallos (429/timeout/5xx/inválido/vacío) con fallback a resultados internos.
- API key solo en servidor.

### Fuera del alcance
- Orquestación del flujo de recomendación/dedup/merge (spec 10), rate limiting de nuestra API (spec 11), tests con mock (spec 16).

## Requisitos

| ID | Requisito |
|----|-----------|
| REQ-01 | Definir el puerto `ExternalRecipeProvider` con al menos `searchByIngredients(...)` y `getRecipeById(...)`; el dominio no debe conocer Spoonacular. |
| REQ-02 | Adapter en `src/infrastructure/spoonacular/` con `client/`, `mappers/`, `providers/`; implementar `SpoonacularRecipeProvider`. |
| REQ-03 | Responsabilidades del client: base URL, API key, HTTP, **timeout**, reintentos cuando sean apropiados, clasificación de errores, conciencia de rate limiting, parsing de respuestas. |
| REQ-04 | API key `SPOONACULAR_API_KEY` solo en servidor; nunca `NEXT_PUBLIC_SPOONACULAR_API_KEY`. |
| REQ-05 | Antes de implementar, verificar la documentación actual de Spoonacular: endpoints de búsqueda por ingredientes, información detallada de recetas, búsqueda avanzada, filtros por cuisine, filtros por tipo, tiempo de preparación, dieta/intolerancias cuando estén disponibles. Sin endpoints obsoletos. |
| REQ-06 | Pipeline de mapeo — nunca devolver JSON crudo de Spoonacular al frontend: `Spoonacular DTO → Spoonacular Mapper → Application DTO → Domain/Application model → API Response`. |
| REQ-07 | Las recetas llevan `source = SPOONACULAR` (y external id/URL) para que futuros proveedores se agreguen vía `Recipe.source`. |
| REQ-08 | Manejo de fallos: en 429, timeout, 500, caída, cuota excedida o respuesta inválida la aplicación **sigue funcionando**; si existen resultados internos, muéstralos; nunca exponer errores técnicos (sin "AxiosError 429…" para el usuario). Mensaje amigable p. ej. *"No pudimos consultar algunas recetas externas, pero encontramos estas opciones con tus ingredientes."* (copy de UI localizable — ver spec 12). |
| REQ-09 | `SpoonacularRecipeProvider` debe ser reemplazable en tests con `MockExternalRecipeProvider` (sin API real en tests unitarios — spec 16). |

## Dependencias

- `06-domain-layer`, `02-architecture-foundation`, `01-project-scaffold` (env vars), `07-application-layer` (consumidores).

## Criterios de aceptación

- [ ] La aplicación compila y funciona con la key de Spoonacular eliminada/endpoint caído: las recetas internas siguen retornando (sin crash, sin error crudo al usuario).
- [ ] Ninguna forma de JSON de Spoonacular aparece fuera de `src/infrastructure/spoonacular/`.
- [ ] Timeout aplicado en cada llamada externa.
- [ ] Lista de endpoints verificada contra la documentación oficial actual (referencia registrada en el PR).

## Verificación

Tests unitarios con `MockExternalRecipeProvider` (success, timeout, 429, 500, malformado, vacío) en la spec 16 + prueba manual de corte de red.
