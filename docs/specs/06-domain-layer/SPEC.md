# SPEC: 06 — Capa de dominio (entidades, value objects, puertos, errores, normalización)

**Fuente:** PROMTP.md #10 (Entidades), #11 (Value objects), #12 (Puertos de repositorio), #37 (Tipos de error — parte de dominio), #50 (Normalización de ingredientes), #84/#85 (Reglas de Cuisine), #15 (VO de match score).

## Propósito

Crear el dominio independiente de tecnología: entidades, value objects, interfaces de puertos de repositorio, errores de dominio y normalización de ingredientes — con `Cuisine` como entidad extensible, nunca un enum rígido.

## Alcance

### Dentro del alcance
- Seis entidades con los campos conceptuales exactos de PROMTP #10.
- Value objects: `IngredientName`, `MealType`, `Quantity`, `Unit`, `RecipeMatchScore`.
- Interfaces de puertos de repositorio.
- Taxonomía de errores de dominio.
- Reglas de normalización de ingredientes.

### Fuera del alcance
- Casos de uso (spec 07), lógica de matching/recomendación (spec 10), filas de BD/mappers (specs 03/08), mapeo HTTP de errores (spec 11).

## Requisitos

| ID | Requisito |
|----|-----------|
| REQ-01 | **Recipe**: `id, name, slug, description, cuisineId, country, region, mealType, instructions, preparationTime, cookingTime, servings, difficulty, imageUrl, source, sourceUrl, timestamps`. `source` ∈ `INTERNAL \| SPOONACULAR \| AI_GENERATED \| OTHER` (ahora solo se usan INTERNAL/SPOONACULAR; los demás valores no deben requerir rediseño de esquema/código a futuro). |
| REQ-02 | **Cuisine**: `id, name, slug, country, region, description, createdAt, updatedAt`. Entidad-catálogo extensible — **nunca** un enum rígido; las nuevas cocinas se agregan solo con datos. |
| REQ-03 | **Ingredient**: `id, name, normalizedName, category, isPantryStaple, createdAt, updatedAt`. |
| REQ-04 | **RecipeIngredient**: `recipeId, ingredientId, quantity, unit, optional, notes`. |
| REQ-05 | **PantryItem**: `id, userId, ingredientId, quantity, unit, createdAt, updatedAt`. |
| REQ-06 | **FavoriteRecipe**: `userId, recipeId, createdAt`. |
| REQ-07 | Value objects: `IngredientName`, `MealType` (`BREAKFAST \| LUNCH \| DINNER \| SNACK \| DESSERT \| ANY`), `Quantity`, `Unit`, `RecipeMatchScore`. |
| REQ-08 | Interfaces de puertos de repositorio, independientes de Supabase: `RecipeRepository`, `IngredientRepository`, `CuisineRepository`, `PantryRepository`, `FavoriteRepository`, `UserRepository`. Dominio/aplicación nunca conocen la tecnología de persistencia. |
| REQ-09 | Errores de dominio: `DomainError`, `ValidationError`, `UnauthorizedError`, `ForbiddenError`, `NotFoundError`, `ConflictError`, `ExternalServiceError`, `RepositoryError` (el mapeo a HTTP ocurre en la spec 11, no aquí). |
| REQ-10 | Normalización de ingredientes: `Tomate` / `tomate` / `TOMATE` mapean al mismo ingrediente (case-insensitive vía `normalizedName`). La arquitectura debe dejar espacio para sinónimos/traducciones/plurales/nombres regionales (`aguacate/avocado/palta`) — **sin NLP** en el MVP. |
| REQ-11 | Los archivos de dominio no importan frameworks, bases de datos ni HTTP externo (regla aplicada por la spec 02). |

## Dependencias

- `02-architecture-foundation`, `01-project-scaffold`.

## Criterios de aceptación

- [x] Las seis entidades y los cinco value objects existen con exactamente los campos/valores indicados.
- [x] Compilar el dominio no requiere paquetes de Supabase/Spoonacular/Next.js/React.
- [x] Los puertos de repositorio son interfaces puras utilizables con mocks.
- [x] Tests unitarios de normalización: las variantes de mayúsculas resuelven a un solo ingrediente.
- [x] Agregar una cocina no requiere cambio de código (datos-driven).

## Verificación

Tests unitarios de normalización, `MealType` y `RecipeMatchScore`; auditoría de imports para REQ-11.
