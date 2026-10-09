# ODD — Spec 08: Infraestructura Supabase (repositorios y mappers)

## Objetivo
Implementar los adapters de Supabase: un repositorio por cada uno de los 6 puertos del dominio
(`RecipeRepository`, `IngredientRepository`, `CuisineRepository`, `PantryRepository`,
`FavoriteRepository`, `UserRepository`), los mappers fila↔entidad que son la frontera arquitectónica,
y el cableado de infraestructura — el único lugar donde el proyecto conoce SQL/Supabase.

## Por qué
Los puertos de la spec 06 y los casos de uso de la spec 07 ya existen pero no tienen implementación
real. Sin estos adapters la app no persiste ni lee datos reales. Los mappers garantizan que ningún
row de Supabase cruce hacia dominio/aplicación (REQ-03).

## Alcance autorizado
- **Dentro:** `src/infrastructure/supabase/` — `client/` (clientes + admin server-only),
  `mappers/` (6 mappers), `repositories/` (6 adapters + factory), más sus unit tests.
- **Fuera de alcance (prohibido):** esquema/migraciones (spec 03), RLS (spec 04), Spoonacular (spec 09),
  composition root (spec 02/07), cambios al dominio (spec 06) o a los casos de uso (spec 07),
  tests de integración contra BD real (spec 16).

## Restricciones
- pnpm ONLY. **Comentarios de código en español** (`preferences/code-comments-spanish`).
  UI copy español; identificadores/commits en inglés.
- Hexagonal: solo `src/infrastructure/**` conoce Supabase/SQL. Mappers obligatorios (REQ-03).
- Tipos de fila SOLO desde `src/types/database.types.ts` (`Tables<…>`, `TablesInsert<…>`); REQ-04.
- Errores de persistencia → `RepositoryError` (REQ-07); nunca errores crudos de Postgres.
- Sin N+1: `findByIds` en una sola query `IN`; pantry/favorites en una sola query por usuario (REQ-06).
- Client server-only; `SUPABASE_SECRET_KEY` jamás en `NEXT_PUBLIC_*` ni en bundle de navegador (REQ-08).
- TDD estricto: NO configurado → checks ordinarios `pnpm lint && pnpm typecheck && pnpm test`.
- RDD: **off** (clone-local) → sin ceremonia de revisión nativa.
- Entrega (preferencia #55): **sin PR y sin merge a main** salvo pedido explícito. Commits
  de work-unit en `feat/08-infrastructure-supabase`; merge/push son decisión del usuario.

## Decisiones de diseño
- **REQ-02 layout:** `client/`, `repositories/`, `mappers/` bajo `src/infrastructure/supabase/`.
  Los clientes browser/server se mueven a `client/` (solo cambian 2 imports). El adapter de auth se
  mantiene en `src/infrastructure/auth/` porque la spec 05 fijó esa ubicación y ya está en uso.
- **Nulls de BD → dominio (frontera del mapper):** las columnas nullable de la spec 03 se normalizan
  a valores neutros documentados donde exista uno; solo se lanza `RepositoryError` cuando no hay
  valor neutro posible (`recipes.cuisine_id` null → no representable).
  - `meal_type` null → `"ANY"`; `source` null → `"OTHER"`; `instructions` null → `""`;
    `preparation_time` null → `0`; `servings` null → `1`; `difficulty` inválido → `null`.
  - `pantry_items.quantity` null → `Quantity(0)`; `unit` null → `Unit("unit")`.
  - `is_pantry_staple` null → `false`.
- **Ingredient.save:** upsert por PK (`onConflict: "id"`); no hay UNIQUE sobre `normalized_name`
  en la migración (solo índice), así que la deduplicación es responsabilidad del caso de uso.
- **Pantry.upsert:** `onConflict: "user_id,ingredient_id"` sin escribir `id`/timestamps (el trigger
  de `updated_at` y el `id` existente se conservan en el conflicto).
- **Favorites.add:** upsert idempotente `ignoreDuplicates` por `(user_id, recipe_id)`.
- **UserRepository:** `User` (spec 06) requiere `email`, pero `profiles` no lo almacena (spec 03);
  el único origen es `auth.users`. Se implementa con el **admin client** (server-only): lecturas vía
  `auth.admin.getUserById` / `listUsers` paginado, y `save` hace upsert del perfil `profiles(id)`.
  Limitación documentada: `findByEmail` no tiene lookup indexado en la Admin API (scan paginado).
- **RecipeIngredient / joins:** el agregado `Recipe` de la spec 06 NO incluye ingredientes y el
  puerto no expone un método con relaciones → no hay N+1 posible en estos repositorios. La carga de
  `recipe_ingredients` pertenece al motor de recomendación (spec 10). Se documenta.
- **Composition root:** fuera de alcance (spec 07 prohíbe importar adapters reales desde
  `application.ts`). Se expone `createSupabaseRepositories()` como único punto de inyección que el
  composition root futuro consumirá.

## Forecast de entrega
- Forecast authored changed lines (additions + deletions, tests incluidos): **~900–1200** → >400.
- Política del proyecto: sin PR. Work-unit commits en `feat/08-infrastructure-supabase`.
  Slices: S1 clientes+mappers · S2 repositorios+factory · S3 tests · S4 docs/evidencia.

## Tareas
- [ ] T1 — Rama `feat/08-infrastructure-supabase` desde `main`.
- [ ] T2 — Documento ODD + espejo en Engram.
- [ ] T3 — `client/`: mover browser/server client; añadir `admin-client.ts` server-only.
- [ ] T4 — Mappers `mappers/`: recipe, ingredient, cuisine, pantry-item, favorite-recipe, user.
- [ ] T5 — Repositorios `repositories/`: 6 adapters Supabase + `repository-error` helper.
- [ ] T6 — Factory `createSupabaseRepositories()` (único punto de inyección).
- [ ] T7 — Tests: mappers (puros) + repositorios (fake client, sin N+1, `RepositoryError`).
- [ ] T8 — Verificación `pnpm lint && pnpm typecheck && pnpm test`.
- [ ] T9 — Actualizar evidencia en `docs/specs/08-infrastructure-supabase/{SPEC,ISSUE}.md`.
- [ ] T10 — Work-unit commits en la rama feature.

## Criterios de aceptación (SPEC 08)
- [ ] Cada puerto tiene exactamente una implementación Supabase alcanzable vía la factory.
- [ ] Cero objetos row salen de `src/infrastructure/` (auditoría de tipos/imports).
- [ ] Consultas sin N+1 (una query por listado / `findByIds`).
- [ ] Errores normalizados a `RepositoryError`.
- [ ] Client server-only; sin service-role en paths de navegador.

## Verificación
- `pnpm lint && pnpm typecheck && pnpm test`.
- Unit tests: mappers (snake_case↔camelCase, defaults de nulls, `RepositoryError`) y repositorios
  con un fake client que registra las queries (filtros, `onConflict`, una sola query).
- (Diferido a spec 16) integración contra Supabase real.

## Progreso
_(pendiente)_
