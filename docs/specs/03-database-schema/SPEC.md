# SPEC: 03 — Esquema de base de datos y migraciones

**Fuente:** PROMTP.md #18 (Base de datos), #19 (Diseño de BD), #23 (MCP de Supabase), #24 (MCP vs SDK vs Auth), #25 (Workflow MCP), #58 (Tipos TS), #68 (Migraciones), #69 (Índices), #84 (Modelo de datos multicocina), #85 (País vs cocina).

## Propósito

Definir el esquema PostgreSQL completo para Supabase — tablas, columnas, constraints, índices, migraciones versionadas, tipos TypeScript generados — con `cuisines` como catálogo extensible (nunca un enum rígido).

## Alcance

### Dentro del alcance
- Tablas, columnas, constraints e índices del MVP.
- Migraciones versionadas en `supabase/migrations/`.
- `src/types/database.types.ts` generado.
- Configuración del MCP de Supabase y su workflow de migraciones.
- Reglas de modelo de datos: catálogo de cocinas vs enum; país ≠ cocina.

### Fuera del alcance
- Políticas RLS (ver `04-security-rls`).
- Contenido de seed (ver `15-seed-data`).
- Implementaciones de repositorios (ver `08-infrastructure-supabase`).

## Requisitos

| ID | Requisito |
|----|-----------|
| REQ-01 | Tablas (mínimo): `profiles`, `cuisines`, `ingredients`, `recipes`, `recipe_ingredients`, `pantry_items`, `favorite_recipes`. `recipe_tags` y `dietary_tags` pueden diferirse para el MVP, pero el diseño debe dejarles espacio. |
| REQ-02 | `profiles` se relaciona con `auth.users`. Nunca almacenar contraseñas manualmente. |
| REQ-03 | `cuisines`: `id, name, slug, country, region, description, created_at, updated_at`; `slug` UNIQUE; índices apropiados. |
| REQ-04 | `ingredients`: `id, name, normalized_name, category, is_pantry_staple, created_at, updated_at`; índice sobre `normalized_name`; búsqueda case-insensitive (`Tomate` = `tomate` = `TOMATE`). |
| REQ-05 | `recipes`: `id, name, slug, description, cuisine_id, country, region, meal_type, instructions, preparation_time, cooking_time, servings, difficulty, image_url, source, source_url, created_at, updated_at`. |
| REQ-06 | `recipe_ingredients`: relaciones + constraints, índices sobre `recipe_id` e `ingredient_id`. |
| REQ-07 | `pantry_items`: `user_id, ingredient_id, quantity, unit, created_at, updated_at` con un unique constraint que evite filas duplicadas de usuario+ingrediente. |
| REQ-08 | `favorite_recipes`: `user_id, recipe_id, created_at` con `UNIQUE(user_id, recipe_id)`. |
| REQ-09 | Índices mínimo: `ingredients.normalized_name`, `recipes.slug`, `recipes.cuisine_id`, `recipes.meal_type`, `recipes.source`, `recipe_ingredients.recipe_id`, `recipe_ingredients.ingredient_id`, `pantry_items.user_id`, `pantry_items.ingredient_id`, `favorite_recipes.user_id`. Agregar solo los justificados. |
| REQ-10 | El esquema vive en **migraciones versionadas** (`supabase/migrations/001_*.sql`, …), nunca solo en `seed.sql`. |
| REQ-11 | `cuisines` es una tabla de catálogo, **no** un enum TS/SQL: agregar una cocina = `INSERT`, sin cambio de código; debe escalar de 10 a 100+ cocinas sin cambio estructural. |
| REQ-12 | Almacenar `cuisine`, `country`, `region` por separado; nunca forzar `country = cuisine` (p. ej. Mediterráneo abarca varios países). |
| REQ-13 | Generar `src/types/database.types.ts` desde el esquema real; documentar el comando de regeneración; nunca escribir a mano tipos que contradigan la BD. |
| REQ-14 | Configurar el MCP oficial de Supabase para desarrollo (verificar URL/config actual en la documentación oficial; sin credenciales hardcodeadas). Entender los tres conceptos distintos: **MCP** (tooling de desarrollo), **SDK** (runtime), **Auth** (usuarios finales). |
| REQ-15 | Workflow MCP: inspeccionar proyecto → tablas → relaciones → RLS → funciones/triggers → migraciones existentes → planificar → migración versionada → aplicar → verificar → regenerar tipos → ejecutar tests. Cualquier cambio vía MCP debe quedar reflejado en migraciones del repo; nunca dejar cambios solo en Supabase Cloud; nunca asumir que el proyecto está vacío. |

## Dependencias

- `01-project-scaffold`.

## Criterios de aceptación

- [ ] Las migraciones aplican limpias en una instancia Supabase nueva y en una existente (idempotentes por orden de versión).
- [ ] Todas las tablas de REQ-01 existen con las columnas/constraints de REQ-03…REQ-08.
- [ ] Todos los índices de REQ-09 existen.
- [ ] `database.types.ts` regenerado desde el esquema vivo, no escrito a mano.
- [ ] Insertar una fila nueva en `cuisines` funciona sin ningún cambio de código (REQ-11).
- [ ] La búsqueda case-insensitive sobre `normalized_name` devuelve `Tomate` para la query `TOMATE`.

## Verificación

```bash
# aplicar las migraciones a una base limpia, luego:
pnpm typecheck   # los tipos reflejan el database.types.ts generado
```
Más verificaciones SQL de constraints/índices y una auditoría manual del workflow MCP.
