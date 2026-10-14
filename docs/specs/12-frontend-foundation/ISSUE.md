# ISSUE: 12 — Base del frontend

## Título

Definir la base del frontend: landing page, componentes compartidos, UX mobile-first y estrategia de estado

## Descripción

Antes de construir pantallas funcionales hay que fijar el lenguaje visual y las reglas: app de descubrimiento de comida (no panel administrativo), landing en `/` con el mensaje central y CTA, los 15 componentes reutilizables, estándares UX (estados loading/empty/error, accesibilidad) y la estrategia de estado sin Redux, priorizando Server Components.

## Objetivo

Una base de UI coherente y reutilizable: landing que comunica el producto, primitivas de componentes listas para las pantallas, y reglas claras de Server/Client Component para no disparar el JavaScript en el cliente.

## Alcance

- Principios de UX mobile-first/responsive/accesible (#38, #46).
- Landing `/` con mensaje, CTA "Comenzar", ejemplos visuales y 4 pasos (#39).
- 15 componentes compartidos (#45) con shadcn/ui donde aplique.
- Estrategia de estado: Server Components, Server Actions, React state, URL params, RHF; sin Redux (#47, #48).
- Readiness i18n del copy (#51).
- Formularios RHF + Zod con validación visible.

**Fuera de alcance:** pantallas de dashboard/pantry (spec 13), recipes/detail/favorites (spec 14), páginas de auth (spec 05).

## Casos de prueba

1. `/` muestra el titular "¿Qué puedo cocinar con lo que tengo?", CTA y los 4 pasos explicados.
2. Cada componente de la lista del SPEC existe y renderiza con datos de prueba.
3. Estados vacíos y de carga visibles en las vistas que consumen datos.
4. Auditoría `'use client'`: solo formularios/interacción; páginas de datos son Server Components.
5. Viewport móvil sin scroll horizontal; HTML semántico con labels.
6. Validaciones de formulario se muestran visualmente al usuario.

## Consideraciones técnicas

- El tono de la UI es "food discovery", no dashboard administrativo: esto guía todas las specs de pantallas siguientes.
- Los estados vacío/carga/error son obligatorios en toda vista de datos (#46).
- El copy debe poder extraerse a un sistema de i18n más adelante (#51).
- Preferir URL search params para filtros compartibles antes que estado global.

## Criterios de aceptación

- [x] Landing completa y responsiva en `/`. *(`src/app/page.tsx`; prerenderizada estática en `pnpm build`)*
- [x] Los 15 componentes creados bajo `src/components/` (subcarpetas según tipo). *(**nota de conteo:** REQ-03 enumera 16 nombres (incluye los 4 estados/`FavoriteButton`); se implementaron los 16. Ver nota abajo)*
- [x] Reglas de estado escritas y aplicadas: cero Redux, cero global state innecesario. *(auditoría `tests/unit/components/client-boundary.test.ts`)*
- [x] Cada vista de datos con loading/empty/error. *(primitivas en `src/components/shared/`: `empty-state`, `loading-state`, `error-state`)*
- [x] Validación visible con RHF + Zod en los formularios existentes. *(formularios de auth; primitivas listas para el resto)*

## Resultado esperado

Base de frontend lista: landing pública que convierte, biblioteca de componentes compartidos y reglas de rendimiento/estado que las pantallas funcionales (specs 13–14) reutilizarán directamente.

### Nota de conteo (15 vs 16)

El texto libre de la spec dice "15 componentes", pero la enumeración autoritativa de REQ-03 lista **16**: `IngredientSearch`, `IngredientSelector`, `PantryList`, `PantryItem`, `MealTypeSelector`, `CuisineSelector`, `RecipeCard`, `RecipeGrid`, `RecipeMatchScore`, `MissingIngredients`, `RecipeIngredients`, `RecipeInstructions`, `FavoriteButton`, `EmptyState`, `LoadingState`, `ErrorState`. Se implementaron los 16. La discrepancia es del texto de la spec, no del alcance (mismo caso que la nota 16-vs-18 de la spec 07).

## Evidencia de implementación (implementado 2026-10-10 · registrado 2026-10-13)

**Estado:** completada (verificación unitaria/estructural; sin pase visual manual).

**Commits de work-unit** en `feat/frontend-foundation`: `2eee5a1` (task doc) · `0b0d4ae` (RTL + primitivas y componentes de receta) · `48bf175` (filtros, ingredientes, pantry, favoritos) · `a831c6c` (landing) · `2d83ad0` (tests RTL).

- **Landing `/`** (`src/app/page.tsx`): titular exacto, CTA `Comenzar` → `/register`, `Iniciar sesión` → `/login`, 3 ejemplos y los 4 pasos; reveal con `prefers-reduced-motion`.
- **Componentes:** `src/components/{ui,shared,recipes,filters,ingredients,pantry,favorites}/` (16 componentes + primitivas `ui/`: button, card, badge, input, skeleton, label).
- **Copy centralizado:** `src/lib/i18n/messages.ts` (readiness i18n, REQ-07).
- **Tests:** 12 archivos en `tests/unit/components/`.
- **Verificación observada (2026-10-10):** `pnpm lint` PASS · `pnpm typecheck` PASS · `pnpm test` PASS — 41 archivos / 254 tests · `pnpm build` PASS (`/` prerenderizada estática).
- **Nota TDD honesta:** no se observó RED-first. El runner RTL no existía cuando se implementaron las unidades de UI; la suite de componentes se escribió después contra las APIs observadas. Para componentes presentacionales se documentó la excepción y se usaron checks estructurales.
- **Pendiente honesto:** el viewport móvil y la accesibilidad se validaron por estructura (HTML semántico, labels, sin overflow en las primitivas), no con un pase visual manual ni con auditoría automatizada.
- **Desviación de proceso:** el registro no se volcó a `docs/specs/` en su momento (solo a `odd/tasks/12-frontend-foundation.md`); se corrige con esta nota.
