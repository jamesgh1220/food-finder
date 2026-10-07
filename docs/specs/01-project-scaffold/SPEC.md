# SPEC: 01 — Scaffold del proyecto

**Fuente:** PROMTP.md #5 (Stack), #6 (Dependencias de BD), #57 (Variables de entorno), #75 (No sobreingeniería), #77 (Lint/Formato), #92 (Verificación de versiones), #93 (Regla de Next.js), #99 (Primer paso), Milestone 1.

## Propósito

Inicializar el repositorio de Food Finder como un único proyecto Next.js + TypeScript con el tooling, los scripts y el contrato de variables de entorno sobre los que se construirán todas las specs siguientes.

## Alcance

### Dentro del alcance
- Inspección del repositorio antes de cualquier cambio (sin destruir trabajo existente).
- Scaffold de Next.js App Router + React + TypeScript (strict).
- Tooling de estilos/UI: Tailwind CSS, shadcn/ui, Lint React, React Hook Form, Zod.
- Configuración de lint/format/typecheck y scripts de `package.json`.
- `.env.example` con el contrato completo de variables de entorno.
- Límite explícito de "no sobreingeniería" para todo el proyecto.

### Fuera del alcance
- Capas hexagonales y estructura de carpetas (ver `02-architecture-foundation`).
- Configuración de Supabase, auth o base de datos (ver `05-supabase-auth`, `03-database-schema`).
- Código de cualquier funcionalidad.

## Requisitos

| ID | Requisito |
|----|-----------|
| REQ-01 | Inspeccionar el repo primero: identificar stack, dependencias, configuración, artefactos de Supabase y migraciones existentes. No destruir trabajo existente sin una razón clara. |
| REQ-02 | Proyecto Next.js único; el backend vive dentro de él (Route Handlers/Server Actions). Sin servicio backend separado. |
| REQ-03 | Usar únicamente prácticas actuales de App Router. **No** crear el directorio `pages/`. Leer la documentación actual de Next.js antes de escribir código. |
| REQ-04 | Verificar versiones estables actuales y mutuamente compatibles **antes de instalar**: Next.js, React, TypeScript, paquetes de Supabase, Tailwind CSS, shadcn/ui, Zod, React Hook Form, Vitest, Playwright. Sin configuraciones legadas copiadas de tutoriales antiguos. |
| REQ-05 | ESLint + Prettier + TypeScript `strict` configurados. |
| REQ-06 | Scripts que existen y funcionan: `dev`, `build`, `start`, `lint`, `typecheck`, `test`, `test:watch`, `test:e2e` (scripts de Supabase opcionales). |
| REQ-07 | Crear `.env.example` con: `NEXT_PUBLIC_SUPABASE_URL`, `NEXT_PUBLIC_SUPABASE_PUBLISHABLE_KEY`, `SUPABASE_SECRET_KEY`, `SPOONACULAR_API_KEY`, `SPOONACULAR_BASE_URL`, `NEXT_PUBLIC_APP_URL`. Verificar el naming vigente de las variables de Supabase antes de finalizar. |
| REQ-08 | Nunca definir `NEXT_PUBLIC_SUPABASE_SECRET_KEY` ni `NEXT_PUBLIC_SPOONACULAR_API_KEY`. |
| REQ-09 | Stack prohibido para el MVP: microservicios, Kafka, Kubernetes, Redis sin necesidad, GraphQL, Elasticsearch, base de datos vectorial, event sourcing, CQRS completo, pagos, subscriptions, push notifications, agentes IA complejos, arquitectura distribuida. |

## Dependencias

Ninguna. Es el Milestone 1 y el primer entregable.

## Criterios de aceptación

- [ ] `pnpm install`, `pnpm dev`, `pnpm build`, `pnpm lint`, `pnpm typecheck` funcionan todos.
- [ ] Todos los scripts de REQ-06 existen y terminan con 0 (los tests pueden estar vacíos hasta `16-testing-strategy`).
- [ ] `.env.example` coincide exactamente con REQ-07; ninguna variable `NEXT_PUBLIC_*` secreta en ningún lugar.
- [ ] No existe el directorio `pages/`.
- [ ] Las versiones elegidas están documentadas y son coherentes con REQ-04.

## Verificación

```bash
pnpm lint && pnpm typecheck && pnpm build
```
