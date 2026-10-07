# ISSUE: 08 — Infraestructura: repositorios Supabase y mappers

## Título

Implementar los repositorios Supabase y los mappers fila→entidad para los 6 puertos del dominio

## Descripción

Los puertos del dominio necesitan su implementación concreta en Supabase. Esta spec crea un repositorio por puerto, los mappers obligatorios (las filas de Supabase jamás llegan al dominio), el adapter de auth técnico y el uso de los tipos generados de la base de datos.

## Objetivo

Persistencia funcional tras una interfaz limpia: las capas superiores usan puertos; solo `src/infrastructure/supabase/` conoce SQL, tablas y el SDK.

## Alcance

- Implementaciones: `SupabaseRecipeRepository`, `SupabaseIngredientRepository`, `SupabaseCuisineRepository`, `SupabasePantryRepository`, `SupabaseFavoriteRepository`, `SupabaseUserRepository`.
- Estructura `client/ repositories/ mappers/ auth/`.
- Mappers obligatorios en ambas direcciones con `database.types.ts`.
- Traducción eficiente de consultas (índices, joins, sin N+1).
- Wrap de errores de persistencia en `RepositoryError`.

**Fuera de alcance:** esquema/migraciones, RLS, Spoonacular, composition root.

## Casos de prueba

1. `AddPantryIngredient` persiste y `GetUserPantry` la recupera (integración con BD real).
2. `GetRecipeById` retorna la receta con sus ingredientes en un número acotado de queries (sin N+1).
3. `SearchRecipes` filtra por `meal_type`/`cuisine_id` usando los índices.
4. Un error de BD se presenta como `RepositoryError`, nunca como error crudo de Postgres.
5. Ningún objeto row cruza fuera de `src/infrastructure/` (auditoría de imports/tipos).
6. El repositorio usa el client server; ningún path usa service-role en el navegador.

## Consideraciones técnicas

- Mapear exactamente columnas snake_case ↔ campos camelCase de las entidades.
- Los tipos de fila provienen SOLO de `database.types.ts` regenerado (spec 03).
- Cuidar el alcance por usuario en pantry/favoritos incluso con RLS: el repositorio filtra por `user_id` explícitamente.

## Criterios de aceptación

- [ ] 6 repositorios implementados e inyectados por puerto.
- [ ] Mappers completos; cero rows directos hacia la aplicación.
- [ ] Tests de integración de persistencia en verde.
- [ ] Consultas sin N+1 y usando los índices definidos.
- [ ] Errores normalizados a `RepositoryError`.

## Resultado esperado

Adapters Supabase completos tras los puertos del dominio: la aplicación lee y escribe datos reales sin conocer Supabase, con mappers que protegen la independencia arquitectónica.
