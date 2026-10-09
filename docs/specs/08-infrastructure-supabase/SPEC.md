# SPEC: 08 — Infraestructura: repositorios Supabase y mappers

**Fuente:** PROMTP.md #8 (Infrastructure), #12 (puertos a implementar), #58 (tipos de BD), #59 (Mappers), #69 (Índices — uso en consultas).

## Propósito

Implementar los adapters de Supabase: un repositorio por puerto de dominio, mappers fila↔entidad y el adapter técnico de auth — el único lugar donde se permite existir conocimiento de SQL/Supabase.

## Alcance

### Dentro del alcance
- Implementaciones `Supabase*Repository` para los seis puertos.
- Mappers fila → dominio (y entidad → fila cuando aplique) usando `database.types.ts` generado.
- Adapter de auth que implementa el puerto de auth.
- Configuración de infraestructura (cableado de clients según la spec 05).

### Fuera del alcance
- Esquema/migraciones (spec 03), RLS (spec 04), Spoonacular (spec 09), composition root (spec 02).

## Requisitos

| ID | Requisito |
|----|-----------|
| REQ-01 | Implementar `RecipeRepository`, `IngredientRepository`, `CuisineRepository`, `PantryRepository`, `FavoriteRepository`, `UserRepository` como adapters de Supabase bajo `src/infrastructure/supabase/`. |
| REQ-02 | Distribución de carpetas: `src/infrastructure/supabase/{client, repositories, mappers, auth}`. |
| REQ-03 | **Nunca** pasar filas de Supabase directamente al dominio/aplicación: `SupabaseRow → RecipeMapper → Recipe` (igual para cada entidad). Los mappers son la frontera arquitectónica. |
| REQ-04 | Usar `src/types/database.types.ts` generado para todos los tipos de fila; sin tipos de fila escritos a mano que puedan desviarse del esquema. |
| REQ-05 | Los repositorios traducen consultas de dominio a SQL eficiente (uso de los índices de la spec 09): filtros sobre `slug`, `cuisine_id`, `meal_type`, `source`, joins vía `recipe_ingredients`, alcance por usuario en `pantry_items.user_id` / `favorite_recipes.user_id`. |
| REQ-06 | Evitar queries N+1 al cargar recetas con ingredientes (batch/join). |
| REQ-07 | Los errores de repositorio se envuelven como `RepositoryError` (error de dominio), nunca se filtran como errores crudos de Supabase/Postgres. |
| REQ-08 | Client de server únicamente: los repositorios usan el client de Supabase server-side; sin service-role key en paths de navegador. |

## Dependencias

- `03-database-schema`, `04-security-rls`, `05-supabase-auth`, `06-domain-layer`, `02-architecture-foundation`.

## Criterios de aceptación

- [x] Cada puerto tiene exactamente una implementación de Supabase inyectada por el composition root.
- [x] Grep muestra cero objetos row saliendo de `src/infrastructure/`.
- [ ] Los tests de integración (spec 16) persisten y recuperan pantry/favoritos/recetas vía repositorios contra una base real. _(diferido a spec 16)_
- [x] Sin N+1: el listado de recetas emite un número acotado de queries sin importar el tamaño del resultado.

## Verificación

Suite de tests de integración contra Supabase (spec 16) + review de código para REQ-03/REQ-07.

## Evidencia (2026-10-09)

- **Implementaciones** (`src/infrastructure/supabase/repositories/`): `supabase-recipe-repository.ts`,
  `supabase-ingredient-repository.ts`, `supabase-cuisine-repository.ts`,
  `supabase-pantry-repository.ts`, `supabase-favorite-repository.ts`,
  `supabase-user-repository.ts` + `repository-error.ts` + factory `createSupabaseRepositories()`
  en `index.ts`. El adapter de auth (`createSupabaseAuthPort`) ya existía en
  `src/infrastructure/auth/` (spec 05) y no se modificó.
- **REQ-03 (frontera de mappers):** grep confirma que `Tables<…>`/`TablesInsert<…>` solo aparecen
  dentro de `src/infrastructure/supabase/{mappers,repositories}`; fuera solo hay imports de tipo
  `Database` (no de filas).
- **REQ-06/REQ-07:** unit tests con un fake de la cadena Postgrest verifican una sola query `IN` por
  `findByIds`, cortes previos a la consulta con filtros vacíos y `RepositoryError` con mensaje en
  español sin filtrar el mensaje crudo de Postgres.
- **REQ-08:** `SUPABASE_SECRET_KEY` se usa únicamente en `src/infrastructure/supabase/client/admin-client.ts`
  (server-only, documentado).
- **Checks:** `pnpm lint` (0 errores), `pnpm typecheck` (0 errores), `pnpm test`
  (**20 archivos / 121 tests en verde**).

