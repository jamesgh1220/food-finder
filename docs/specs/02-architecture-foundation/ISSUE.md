# ISSUE: 02 — Fundamentos de arquitectura

## Título

Definir la arquitectura hexagonal: capas, estructura de carpetas, DI, logging y reglas de independencia del dominio

## Descripción

El prompt exige arquitectura Hexagonal / Ports & Adapters con una regla dura: el dominio no depende de Next.js, React, Supabase ni Gemini. Antes de escribir entidades o casos de uso hay que fijar las capas, el árbol de carpetas, la inyección de dependencias explícita, el logging, la regla de mappers y las restricciones de evolución (i18n, PWA/Capacitor, calidad de código).

## Objetivo

Dejar establecida la "caja de huecos" del proyecto: estructura de carpetas canónica, regla de dependencias verificable y mecanismos transversales (DI, logging, mappers), de modo que todas las specs siguientes solo llenen huecos definidos.

## Alcance

- Definición de las 4 capas y su regla de dependencia (PROMTP #7–#8).
- Estructura de carpetas `src/`, `supabase/`, `tests/`, `docs/` (PROMTP #9).
- Composition root / DI explícita sin framework (PROMTP #60).
- Abstracción de logging con niveles y sin secretos (PROMTP #61).
- Regla obligatoria de mappers para Supabase y Gemini (PROMTP #59).
- Regla de evitar hops innecesarios Server Component → API propia (PROMTP #49).
- Readiness i18n (PROMTP #51) y compatibilidad futura PWA/Capacitor (PROMTP #74).
- Principios de calidad: SOLID, DRY, KISS, tipado estricto (PROMTP #76).

**Fuera de alcance:** entidades, casos de uso, repositorios concretos; documentación/diagrama (spec 17).

## Casos de prueba

1. Auditoría de imports: ningún archivo de `src/domain/` importa paquetes de Next.js/React/Supabase/Gemini.
2. La estructura de carpetas generada coincide con la del SPEC (adaptaciones solo de convención de Next.js actual).
3. Un caso de uso se puede instanciar en tests inyectando repositorios mockeados desde el composition root.
4. El logger expone `debug/info/warn/error` y no registra variables sensibles.
5. Ningún Server Component hace `fetch("/api/...")` a rutas propias del proyecto.

## Consideraciones técnicas

- La regla de dominio puro es la más fácil de violar con el tiempo: conviene una regla de lint/import boundaries, no solo buena voluntad.
- Los mappers son obligatorios en ambas direcciones (BD y externos); son la frontera que protege al dominio.
- No sobrearquitecturar: capas simples, archivos con valor, sin abstracciones sin propósito (PROMTP #76).

## Criterios de aceptación

- [x] Estructura de carpetas creada y documentada según REQ-07.
- [x] Regla REQ-02 verificable y verificada (audit/lint).
- [x] Composition root único y explícito; cero frameworks de DI.
- [x] Logger único con niveles y redacción de secretos.
- [x] Reglas de hops, i18n readiness y PWA/Capacitor escritas en el SPEC y respetadas por el código base.

## Resultado esperado

Un esqueleto hexagonal limpio donde cada capa tiene responsabilidades y límites explícitos, el dominio es independiente de tecnología, y las specs de dominio/aplicación/infraestructura pueden implementarse en paralelo sin rehacer la base.

## Registro de implementación

- **Estado:** Completada.
- **Fecha / rama / commits:** 2026-10-08, rama `feat/02-architecture-foundation` (fusionada a `main`): `d38bb9c` (feature doc), `d500842` (migración de `app/` y `lib/` a `src/` con carpetas por capa), `2bcb731` (reglas de lint de límites hexagonales, REQ-02/REQ-11), `76b4a34` (puerto logger + adaptador console con redacción), `76fcbad` (composition root explícito con puertos inyectables), `07df0a8` (README: reglas hexagonales y mapa de capas), `436cbf3` (evidence/acceptance en la feature doc).
- **Qué se hizo:**
  - Estructura `src/` por capas (`app`, `components`, `domain`, `application`, `infrastructure`, `lib`, `types`) + `supabase/`, `tests/`, `docs/`; capas sin contenido aún marcadas con `.gitkeep` (REQ-07).
  - Reglas de lint verificables: dominio puro sin Next/React/Supabase/Gemini/`fetch` (REQ-02) y prohibición de `fetch("/api/...")` en Server Components (REQ-11), ambas en `eslint.config.mjs`.
  - Puerto `Logger` con niveles `debug/info/warn/error` (`src/application/ports/logger.ts`) y único adaptador console con redacción profunda de secretos (REQ-09).
  - Composition root único sin framework de DI (`src/lib/composition/create-app.ts`, REQ-08), con puertos inyectables para tests.
  - README actualizado con mapa de capas, reglas de mappers, hops, i18n readiness, PWA/Capacitor y calidad (REQ-10 a REQ-14).
  - Tests unitarios de redacción del logger y del composition root con fakes inyectados.
- **Cambios respecto al plan original:**
  - El composition root solo cablea `logger` (`AppServices { logger }`); la cadena de ejemplo de REQ-08 (`SupabaseRecipeRepository` + `GeminiRecipeProvider` → `RecipeRecommendationService` → `FindRecipesFromPantry`) queda documentada en JSDoc como placeholder hasta que las specs de infraestructura/dominio aporten los adapters reales.
  - Las capas sin código se dejaron como `.gitkeep` en lugar de crear archivos sin valor (coherente con PROMTP #76).
- **Dependencias:** depende de `01-project-scaffold` (implementada). Referencias cruzadas: 01 la lista como fuera de alcance y `17-documentation-release` recibe el material documentado aquí; las specs 03–16 se apoyan en la estructura y reglas que esta fija. Estado: 03 implementada; 04–17 pendientes.
- **Verificación** (ejecutada el 2026-10-08 sobre `main`): `pnpm lint` → 0 (incluye las reglas REQ-02/REQ-11 activas); `pnpm typecheck` → 0; `pnpm test` → 7/7 (tests de logger y composition root). Lectura directa de `eslint.config.mjs`, `src/lib/composition/create-app.ts`, `src/application/ports/logger.ts`, `src/infrastructure/logging/console-logger.ts` (redacción de keys sensibles) y README (mapa de capas y reglas). Árbol `src/` verificado con `find`: ninguna capa fuera de `src/`, sin `pages/`.
