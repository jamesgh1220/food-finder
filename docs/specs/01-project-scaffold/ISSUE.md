# ISSUE: 01 — Scaffold del proyecto

## Título

Scaffold del proyecto Next.js con tooling, scripts y contrato de variables de entorno

## Descripción

El repositorio necesita una base técnica consistente antes de cualquier funcionalidad: un proyecto Next.js (App Router) con TypeScript estricto, Tailwind + shadcn/ui, lint/format, los scripts de trabajo requeridos y un `.env.example` que defina todas las variables del sistema. También debe fijar explícitamente el límite de "no sobreingeniería" para evitar que futuras specs introduzcan infraestructura innecesaria.

## Objetivo

Que un desarrollador (o agente) pueda clonar el repo, instalarlo y ejecutar `dev/build/lint/typecheck` sin pasos extra, con un contrato de entorno completo y verificado contra la documentación actual.

## Alcance

- Inspección inicial del repositorio sin destruir trabajo existente.
- Scaffold Next.js + React + TypeScript strict, únicamente App Router (sin `pages/`).
- Dependencias de UI/formularios/validación en versiones actuales y compatibles.
- ESLint, Prettier, TypeScript strict.
- Scripts: `dev`, `build`, `start`, `lint`, `typecheck`, `test`, `test:watch`, `test:e2e`.
- `.env.example` con las variables del prompt (PROMTP #57) y el naming vigente de Supabase.
- Lista de tecnologías prohibidas para el MVP (PROMTP #75).

**Fuera de alcance:** arquitectura hexagonal/carpetas, Supabase, código de features.

## Casos de prueba

1. `pnpm install` completa sin errores con las versiones seleccionadas.
2. `pnpm dev` levanta la app; `pnpm build` compila.
3. `pnpm lint` y `pnpm typecheck` terminan en 0.
4. Los 8 scripts requeridos existen en `package.json`.
5. `.env.example` contiene las 6 variables requeridas y ninguna variable `NEXT_PUBLIC_*` secreta.
6. No existe el directorio `pages/`.

## Consideraciones técnicas

- Verificar versiones estables actuales antes de instalar; no copiar configuraciones antiguas de Tailwind/Next.js (PROMTP #92–#93).
- El secreto de Supabase y la API key de Spoonacular **nunca** llevan el prefijo `NEXT_PUBLIC_`.
- Mantener el MVP simple: sin Redis, GraphQL, microservicios ni otras tecnologías de la lista prohibida (PROMTP #75).

## Criterios de aceptación

- [x] Los comandos de REQ-06 (ver SPEC) existen y funcionan.
- [x] `.env.example` cumple el contrato exacto del SPEC (REQ-07/REQ-08).
- [x] Configuración de lint/format/strict presente y activa.
- [x] Versiones verificadas contra la documentación actual y documentadas en el commit/PR.
- [x] Inspección inicial del repo reportada antes de modificar archivos.

## Resultado esperado

Un proyecto base instalable, compilable y con lint limpio, con contrato de variables de entorno completo, listo para que las siguientes specs añadan arquitectura, datos y features sin rehacer cimientos.

## Registro de implementación

- **Estado:** Completada.
- **Fecha / rama / commits:** 2026-10-07, rama `feat/01-project-scaffold` (fusionada a `main`): `a2162ea` (feature doc), `cbbd226` (Prettier, Vitest, Playwright + set completo de scripts), `6484f24` (shadcn/ui, Zod, React Hook Form), `ee7dc9b` (contrato de entorno y docs de stack/restricciones). Estándar pnpm fijado antes, en `57e13fc`.
- **Qué se hizo:**
  - Inspección baseline del repo reportada en `odd/tasks/project-scaffold.md` antes de modificar archivos (REQ-01).
  - Scaffold App Router sin `pages/`, TypeScript `strict`, ESLint 9 + Prettier activos (REQ-03/REQ-05).
  - Los 8 scripts de REQ-06 en `package.json` (`dev`, `build`, `start`, `lint`, `typecheck`, `test`, `test:watch`, `test:e2e`).
  - `.env.example` con exactamente las 6 variables de REQ-07 y ninguna secreta con prefijo `NEXT_PUBLIC_` (REQ-08).
  - Límite de no sobreingeniería (PROMTP #75) y versiones elegidas documentados en README y en la feature doc.
- **Cambios respecto al plan original:**
  - pnpm es el gestor exclusivo del proyecto (preferencia del usuario); las referencias a npm se migraron en `57e13fc`.
  - El set de scripts se amplió más allá de los 8 requeridos: `format`, `format:check`, `db:push`, `db:types`.
- **Dependencias:** ninguna previa (Milestone 1, primer entregable). Dependencias inversas: las specs 02–17 se apoyan en este scaffold — 02 lo declara explícitamente en su SPEC. Estado: 02 y 03 implementadas; 04–17 pendientes.
- **Verificación** (ejecutada el 2026-10-08 sobre `main`): `pnpm lint` → 0; `pnpm typecheck` → 0; `pnpm build` → 0; `pnpm test` → 7/7; `pnpm test:e2e` → 1/1; `pnpm dev` y `pnpm start` → HTTP 200 en `localhost:3000`. Comprobaciones de estructura: los 8 scripts presentes en `package.json`, `.env.example` con las 6 variables de REQ-07, `tsconfig.json` con `strict: true`, `eslint.config.mjs` + `prettier.config.mjs` presentes, directorio `pages/` inexistente.
