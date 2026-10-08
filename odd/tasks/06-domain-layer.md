# ODD — Spec 06: Capa de dominio

## Objetivo
Construir el dominio puro y testeable de Food Finder: 6 entidades, 5 value objects, 6 puertos de repositorio, la taxonomía de errores de dominio y la normalización de ingredientes — todo independiente de Next.js, React, Supabase y Spoonacular.

## Por qué
El dominio es el corazón del producto y la base sobre la que se apoyarán la capa de aplicación (spec 07) y la infraestructura (spec 08). `Cuisine` debe ser un catálogo extensible (nunca un enum rígido) para escalar de 10 a 100+ cocinas solo con datos.

## Alcance autorizado
- **Dentro:** `src/domain/` — entidades (REQ-01…REQ-06), value objects (REQ-07), puertos (REQ-08), errores (REQ-09), normalización (REQ-10), pureza de imports (REQ-11); tests unitarios de normalización, VOs y auditoría de imports.
- **Fuera de alcance (prohibido):** casos de uso (spec 07), matching (spec 10), mappers/filas de BD (specs 03/08), mapeo HTTP de errores (spec 11), NLP real.

## Restricciones
- pnpm ONLY. **Comentarios de código en español** (preferencia del proyecto, 2026-10-08). UI copy español; identificadores/commits en inglés.
- Hexagonal: `src/domain` no importa `next`, `react`, `@supabase/*`, Spoonacular, `@/app/*`, `@/components/*`, `@/infrastructure/*`, ni usa `fetch` (regla ESLint ya activa, REQ-02/REQ-11).
- Sin librería externa de validación en el dominio (validación a mano con `ValidationError`).
- `Cuisine` es entidad-catálogo, NO enum. `country` ≠ `cuisine` (campos separados).
- TDD estricto: NO configurado → checks funcionales ordinarios: `pnpm lint && pnpm typecheck && pnpm test`.
- RDD: **off** (clone-local) → sin ceremonia de revisión; verificación por tier tras el diff.
- Entrega: política del proyecto **sin PRs** → commits de work-unit en rama feature y merge directo a `main`.

## Forecast de entrega
- Forecast authored changed lines (additions + deletions, tests incluidos, generados excluidos): **~750–900** → >400 (heurística).
- Política fijada por el usuario: **sin PRs**. Se entrega como **commits de work-unit** y merge directo a `main`. Slices:
  - S1: entidades + value objects.
  - S2: errores + puertos.
  - S3: normalización + tests.

## Tareas
- [ ] T1 — Rama `feat/06-domain-layer` desde `main`.
- [ ] T2 — Documento ODD + espejo en Engram.
- [ ] T3 — Entidades con campos exactos de PROMTP #10: `Recipe` (source ∈ INTERNAL|SPOONACULAR|AI_GENERATED|OTHER), `Cuisine`, `Ingredient`, `RecipeIngredient`, `PantryItem`, `FavoriteRecipe`.
- [ ] T4 — Value objects: `IngredientName`, `MealType` (6 valores), `Quantity`, `Unit`, `RecipeMatchScore` (rango 0–1).
- [ ] T5 — Errores de dominio: `DomainError`, `ValidationError`, `UnauthorizedError`, `ForbiddenError`, `NotFoundError`, `ConflictError`, `ExternalServiceError`, `RepositoryError` (sin conocer HTTP).
- [ ] T6 — Puertos puros: `RecipeRepository`, `IngredientRepository`, `CuisineRepository`, `PantryRepository`, `FavoriteRepository`, `UserRepository` (utilizables con mocks).
- [ ] T7 — Normalización: `Tomate`/`tomate`/`TOMATE` → mismo `normalizedName`; arquitectura con punto de extensión para sinónimos/idiomas (sin NLP).
- [ ] T8 — Tests unitarios: normalización, `MealType`, `RecipeMatchScore`, VOs, puertos con mock, auditoría de imports del dominio.
- [ ] T9 — Verificación `pnpm lint && pnpm typecheck && pnpm test`.
- [ ] T10 — Actualizar `docs/specs/06-domain-layer/ISSUE.md` (convención del proyecto).
- [ ] T11 — Merge directo a `main`.

## Criterios de aceptación (SPEC 06)
- [ ] 6 entidades y 5 VOs con campos/valores exactos.
- [ ] Compilar el dominio no requiere Supabase/Spoonacular/Next/React.
- [ ] Puertos como interfaces puras utilizables con mocks.
- [ ] Tests de normalización: variantes de mayúsculas resuelven a un solo ingrediente.
- [ ] Agregar una cocina no requiere cambio de código (data-driven).

## Verificación
- `pnpm lint && pnpm typecheck && pnpm test`.
- Auditoría de imports automatizada (test) sobre `src/domain/**`.

## Progreso
_(pendiente)_
