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
- `.env.example` con las variables del prompt (#57) y el naming vigente de Supabase.
- Lista de tecnologías prohibidas para el MVP (#75).

**Fuera de alcance:** arquitectura hexagonal/carpetas, Supabase, código de features.

## Casos de prueba

1. `pnpm install` completa sin errores con las versiones seleccionadas.
2. `pnpm dev` levanta la app; `pnpm build` compila.
3. `pnpm lint` y `pnpm typecheck` terminan en 0.
4. Los 8 scripts requeridos existen en `package.json`.
5. `.env.example` contiene las 6 variables requeridas y ninguna variable `NEXT_PUBLIC_*` secreta.
6. No existe el directorio `pages/`.

## Consideraciones técnicas

- Verificar versiones estables actuales antes de instalar; no copiar configuraciones antiguas de Tailwind/Next.js (#92, #93).
- El secreto de Supabase y la API key de Spoonacular **nunca** llevan el prefijo `NEXT_PUBLIC_`.
- Mantener el MVP simple: sin Redis, GraphQL, microservicios ni otras tecnologías de la lista prohibida (#75).

## Criterios de aceptación

- [ ] Los comandos de REQ-06 (ver SPEC) existen y funcionan.
- [ ] `.env.example` cumple el contrato exacto del SPEC (REQ-07/REQ-08).
- [ ] Configuración de lint/format/strict presente y activa.
- [ ] Versiones verificadas contra la documentación actual y documentadas en el commit/PR.
- [ ] Inspección inicial del repo reportada antes de modificar archivos.

## Resultado esperado

Un proyecto base instalable, compilable y con lint limpio, con contrato de variables de entorno completo, listo para que las siguientes specs añadan arquitectura, datos y features sin rehacer cimientos.
