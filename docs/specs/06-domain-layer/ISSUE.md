# ISSUE: 06 — Capa de dominio

## Título

Crear la capa de dominio: entidades, value objects, puertos de repositorio, errores de dominio y normalización de ingredientes

## Descripción

El dominio es el corazón de Food Finder y debe ser independiente de toda tecnología (sin Next.js, React, Supabase ni Spoonacular). Esta spec crea las 6 entidades (Recipe, Cuisine, Ingredient, RecipeIngredient, PantryItem, FavoriteRecipe), los 5 value objects, los 6 puertos de repositorio, la taxonomía de errores de dominio y las reglas de normalización de ingredientes.

## Objetivo

Un dominio puro y testeable que modele el producto multicocina — con `Cuisine` como catálogo extensible (no enum) — y que las capas superiores consuman sin conocer la infraestructura.

## Alcance

- Entidades con los campos exactos de PROMTP #10, incluyendo `Recipe.source` con 4 valores.
- Value objects: `IngredientName`, `MealType`, `Quantity`, `Unit`, `RecipeMatchScore`.
- Puertos: `RecipeRepository`, `IngredientRepository`, `CuisineRepository`, `PantryRepository`, `FavoriteRepository`, `UserRepository`.
- Errores de dominio (8 tipos de PROMTP #37).
- Normalización case-insensitive con arquitectura preparada para sinónimos futuros.

**Fuera de alcance:** casos de uso, algoritmo de matching, mappers/DB, mapeo HTTP de errores.

## Casos de prueba

1. `Tomate`, `tomate`, `TOMATE` normalizan al mismo ingrediente.
2. `MealType` solo acepta los 6 valores del prompt.
3. `RecipeMatchScore` valida el rango 0–1.
4. Compilar `src/domain/` no requiere paquetes de Next/React/Supabase/Spoonacular.
5. Los puertos se pueden instanciar con implementaciones mock en tests.
6. Agregar una cocina no implica cambiar código del dominio.

## Consideraciones técnicas

- Prohibido: `enum Cuisine { COLOMBIAN, ... }` como solución principal (#84) — el catálogo debe escalar de 10 a 100+ cocinas sin cambios estructurales.
- `country ≠ cuisine`: mantener `cuisine`, `country`, `region` como campos separados (#85).
- Normalización hoy: case-insensitivity + `normalized_name`; sinónimos/idiomas quedan como extensión futura, sin NLP (#50).
- Los errores de dominio no conocen HTTP; el mapeo a status codes es responsabilidad de la spec 11.

## Criterios de aceptación

- [x] 6 entidades y 5 value objects implementados con los campos/valores exactos del SPEC.
- [x] 6 puertos de repositorio como interfaces puras.
- [x] Taxonomía de errores de dominio completa.
- [x] Tests de normalización y value objects en verde.
- [x] Auditoría de imports: dominio 100% libre de infraestructura.

## Resultado esperado

El modelo de dominio completo y puro, listo para que la capa de aplicación (casos de uso) y la infraestructura (adapters) se construyan sobre él sin acoplamientos.
