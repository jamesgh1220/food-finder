# SPEC: 16 — Estrategia de testing (unit, integración, E2E, seguridad)

**Fuente:** PROMTP.md #62 (Stack de testing), #63 (Tests unitarios), #64 (Tests de integración), #65 (Testing del proveedor externo), #66 (Tests E2E), #67 (E2E de seguridad), #96 (DoD — los tests deben pasar).

## Propósito

Establecer la pirámide de testing del proyecto: Vitest + React Testing Library para tests unitarios/de componentes, Playwright para E2E, más E2E de seguridad — con el proveedor externo (Gemini) siempre mockeado en los tests unitarios.

## Alcance

### Dentro del alcance
- Configuración del tooling de testing y suites: unit de dominio, unit de aplicación, integración, escenarios mock del proveedor externo (Gemini), flujos E2E, E2E de seguridad.

### Fuera del alcance
- Implementación de producto (specs 01–15); esta spec define y ejecuta la verificación.

## Requisitos

| ID | Requisito |
|----|-----------|
| REQ-01 | Stack: **Vitest**, **React Testing Library**, **Playwright** (verificar las versiones compatibles actuales antes de instalar). |
| REQ-02 | **Tests unitarios de dominio** para: normalización de ingredientes, match score, matching de recetas, pantry staples, meal type, filtro de cocina, ingredientes opcionales. |
| REQ-03 | **Tests unitarios de aplicación** para: `FindRecipesFromPantry`, `AddPantryIngredient`, `RemovePantryIngredient`, favoritos, obtención de cocinas — repositorios/providers **mockeados**. |
| REQ-04 | **Nunca** depender de la API real de Gemini en tests unitarios. Crear `MockExternalRecipeProvider` que cubra: éxito, timeout, 429, 500, respuesta malformada, resultado vacío. |
| REQ-05 | **Tests de integración** para: repositorios Supabase, RLS, endpoints de API, auth, persistencia de pantry, favoritos, obtención de recetas. |
| REQ-06 | **Tests E2E (Playwright)** para los 11 flujos: 1 registro, 2 login, 3 dashboard, 4 agregar ingredientes, 5 seleccionar meal type, 6 buscar recetas, 7 ver resultados, 8 ver receta, 9 guardar favorito, 10 consultar favoritos, 11 logout. |
| REQ-07 | **E2E de seguridad**: usuario no autenticado no puede acceder al dashboard; el usuario A no puede acceder a la pantry del usuario B; el usuario A no puede modificar los favoritos del usuario B; RLS funciona realmente; los endpoints validan autorización. |
| REQ-08 | Todas las suites forman parte de la Definition of Done: `pnpm test` y `pnpm test:e2e` deben pasar para un release. |

## Dependencias

Todas las specs de funcionalidad (01–15) para qué testear; tooling de la spec 01.

## Criterios de aceptación

- [ ] Las suites de REQ-02 y REQ-03 existen y están en verde.
- [ ] `MockExternalRecipeProvider` cubre los seis escenarios de REQ-04.
- [ ] La suite de integración ejercita persistencia + RLS contra una base real.
- [ ] Los 11 flujos E2E pasan en CI/local.
- [ ] Los 5 checks de E2E de seguridad pasan con dos usuarios de prueba distintos.
- [ ] Cero tests tocan la API real de Gemini.

## Verificación

```bash
pnpm test && pnpm test:e2e
```
