# SPEC: 17 — Documentación, observabilidad y preparación para release

**Fuente:** PROMTP.md #78 (README), #79 (Documentación), #80 (Diagrama de arquitectura), #89 (Observabilidad), #90 (Deployment readiness), #91 (Desarrollo local), #96 (Definition of Done), #97 (Salida final del agente), #81 (Proceso de desarrollo).

## Propósito

Entregar el set de documentación, el diagrama de arquitectura, la abstracción de observabilidad, la preparación para despliegue y ejecutar la verificación final de la Definition of Done.

## Alcance

### Dentro del alcance
- `README.md` (completo) + diagrama de arquitectura en Mermaid.
- `docs/architecture.md`, `docs/database.md`, `docs/api.md`, `docs/setup.md`, `docs/decisions/`.
- Abstracción de observabilidad (logs/métricas/tracing listos, sin plataforma en el MVP).
- Deployment readiness para una plataforma compatible con Next.js (p. ej. Vercel).
- Verificación final de la checklist de Definition of Done.

### Fuera del alcance
- Implementación de funcionalidades (specs 01–16).

## Requisitos

| ID | Requisito |
|----|-----------|
| REQ-01 | El README explica: qué es Food Finder, stack, arquitectura, estructura, instalación, variables de entorno, Supabase, Supabase Auth, Supabase MCP, Gemini, migraciones, seed, generación de tipos, desarrollo, tests, build, despliegue. Incluye un diagrama de arquitectura en Mermaid. |
| REQ-02 | Crear `docs/architecture.md`, `docs/database.md`, `docs/api.md`, `docs/setup.md` y `docs/decisions/`. |
| REQ-03 | Los registros de decisiones deben documentar especialmente: por qué arquitectura hexagonal, por qué Supabase, por qué Gemini, por qué `Cuisine` es una entidad y no un enum, estrategia de matching, estrategia de fallback, estrategia de seguridad. |
| REQ-04 | Diagrama de arquitectura (Mermaid, según PROMTP #80, mejorado si la arquitectura final lo requiere): UI → Route Handlers/Server Actions → Casos de uso → Servicios de dominio + Puertos → Adaptadores Supabase/Gemini → PostgreSQL/Auth. |
| REQ-05 | Observabilidad: mantener una abstracción que pueda incorporar después logs, métricas, tracing, errores — **sin plataforma externa compleja en el MVP** (se construye sobre el logger de la spec 02). |
| REQ-06 | Deployment readiness: preparado para una plataforma compatible con Next.js (Vercel o equivalente); no asumir un VPS; Supabase = backend gestionado; Gemini = servicio externo (generación de recetas). Arquitectura: `User → Next.js → Supabase → PostgreSQL`, más `Next.js → Gemini` cuando haga falta. |
| REQ-07 | Desarrollo local documentado: `pnpm install`, `pnpm dev`, más comandos para Supabase local, migraciones, seed, generación de tipos, tests (#91). |
| REQ-08 | **Definition of Done** final — verificar TODO: `pnpm install`, `pnpm dev`, `pnpm build`, `pnpm lint`, `pnpm typecheck` funcionan; tests unitarios/integración/E2E pasan; Supabase integrado; Auth funciona; RLS funciona; migraciones funcionan; seed funciona; pantry/recetas/recomendaciones/favoritos/filtro por cocina/multicocina funcionan; el proveedor externo (Gemini) funciona; manejo de fallos del proveedor externo (Gemini) funciona; sin secretos expuestos; API validada; errores manejados; UI responsive; docs actualizadas; `.env.example` existe; tipos de BD al día; MCP documentado/configurado; arquitectura hexagonal respetada; dominio independiente de infraestructura. |
| REQ-09 | Reporte final de entrega según PROMTP #97 (resumen de 25 puntos: arquitectura, estructura de carpetas, dependencias, variables de entorno, migraciones, tablas, RLS, entidades, VOs, casos de uso, puertos, adaptadores, Gemini, algoritmo, endpoints, pantallas, tests, MCP, comandos de dev/test/typegen/Supabase/Gemini, decisiones clave, mejoras futuras). |

## Dependencias

Todas las specs anteriores (01–16).

## Criterios de aceptación

- [ ] El README y los cuatro archivos `docs/*.md` existen y reflejan el sistema implementado (sin contenido aspiracional).
- [ ] El diagrama Mermaid renderiza y refleja la arquitectura real.
- [ ] `docs/decisions/` contiene los siete registros de decisión requeridos.
- [ ] Cada ítem de REQ-08 verificado y en verde.
- [ ] El reporte de REQ-09 producido en la entrega.

## Verificación

Recorrer la checklist de DoD ítem por ítem con resultados observados de comandos; previsualizar README/mermaid.
