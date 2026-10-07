# ISSUE: 16 — Testing Strategy

## Título

Implementar la pirámide de tests: unit (dominio/aplicación), integración, E2E Playwright y seguridad

## Descripción

El proyecto se considera terminado solo cuando unit, integración y E2E pasan (#96). Esta spec define y ejecuta las cuatro capas: tests unitarios de dominio y aplicación con mocks, integración contra Supabase (repositorios, RLS, API, auth), 11 flujos E2E con Playwright y 5 checks E2E de seguridad con dos usuarios.

## Objetivo

Confianza verificable en cada capa: el algoritmo probado matemáticamente, la persistencia probada contra BD real, el flujo completo de usuario probado en navegador y el aislamiento entre usuarios demostrado.

## Alcance

- Vitest + RTL + Playwright (versiones actuales verificadas).
- Unit de dominio: normalización, match score, matching, staples, meal type, filtro de cocina, ingredientes opcionales.
- Unit de aplicación: 5 casos de uso con repositorios mockeados.
- `MockExternalRecipeProvider` con 6 escenarios (success, timeout, 429, 500, malformed, empty).
- Integración: repositorios, RLS, endpoints, auth, pantry, favoritos, recetas.
- E2E: los 11 flujos del PROMPT #66.
- Seguridad E2E: los 5 checks del PROMPT #67.

**Fuera de alcance:** la implementación de product features (specs 01–15).

## Casos de prueba

*(Este issue DESCRIBE los casos — su ejecución es el deliverable.)*

1. Unit dominio: 4/5 = 0.8; staples no penalizan como principal faltante; `TOMATE`=Tomate.
2. Unit aplicación: 5 casos de uso con mocks, sin DB.
3. Mock externo: 6 escenarios → la app nunca lanza excepción no controlada.
4. Integración: persistencia de pantry/favoritos y políticas RLS con 2 usuarios.
5. E2E: los 11 flujos (register → … → logout) en verde.
6. Seguridad: dashboard bloqueado sin sesión; A no ve/edita pantry ni favoritos de B; RLS real; endpoints validan autorización.

## Consideraciones técnicas

- Nunca depender de Spoonacular real en tests unitarios (#65): solo mock.
- Los tests de seguridad necesitan DOS usuarios reales para probar el aislamiento (#67).
- La integración debe correr contra una base con migraciones + seed aplicados (specs 03/15).
- Verificar versiones actuales de Vitest/Playwright antes de instalar (#62).

## Criterios de aceptación

- [ ] `pnpm test` verde (unit + integración según configuración).
- [ ] `pnpm test:e2e` verde con los 11 flujos.
- [ ] 5/5 checks de seguridad en verde.
- [ ] Cero llamadas a la API real de Spoonacular en la suite.
- [ ] Comandos forman parte del Definition of Done.

## Resultado esperado

Suite completa y repetible que protege cada capa del producto y valida los 9 casos de aceptación del PROMPT — condición obligatoria para considerar el MVP terminado.
