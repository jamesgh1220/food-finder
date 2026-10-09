# SPEC: 07 — Capa de aplicación (casos de uso y DTOs)

**Fuente:** PROMTP.md #13 (Casos de uso), #8 (Responsabilidades de Application), #73 (Puerto futuro de IA), #87 (Preferencias futuras de usuario), #88 (Principio de diseño de API — enmarcado en casos de uso).

## Propósito

Implementar los 16 casos de uso de la aplicación con DTOs, coordinación de repositorios/servicios, autorización a nivel de caso de uso y puntos de extensión compatibles con el futuro (enhancer de IA, preferencias de usuario) que se **diseñan pero no implementan** en el MVP.

## Alcance

### Dentro del alcance
- Casos de uso: Auth (4), Pantry (5), Recipes (4), Cuisine (2), Favorites (3).
- DTOs y reglas de orquestación.
- Puertos conceptuales reservados para IA futura y preferencias de usuario.

### Fuera del alcance
- Internals del servicio de recomendación (spec 10), exposición HTTP (spec 11), implementaciones de repositorios (spec 08).

## Requisitos

| ID | Requisito |
|----|-----------|
| REQ-01 | **Auth**: `RegisterUser`, `LoginUser`, `LogoutUser`, `GetCurrentUser`. |
| REQ-02 | **Pantry**: `AddPantryIngredient`, `RemovePantryIngredient`, `UpdatePantryIngredient`, `GetUserPantry`, `ClearUserPantry`. |
| REQ-03 | **Recipes**: `FindRecipesFromPantry`, `GetRecipeById`, `SearchRecipes`, `GetRecipesByMealType`. |
| REQ-04 | **Cuisine**: `GetCuisines`, `GetCuisineById`. |
| REQ-05 | **Favorites**: `AddFavoriteRecipe`, `RemoveFavoriteRecipe`, `GetFavoriteRecipes`. |
| REQ-06 | La capa application posee: DTOs, coordinación, orquestación de repositorios y servicios, y **autorización a nivel de caso de uso** (nunca confiar solo en la UI). |
| REQ-07 | Los casos de uso dependen solo de interfaces/puertos; los adapters concretos se inyectan vía el composition root. |
| REQ-08 | `FindRecipesFromPantry` **no** debe tratar `cuisine` como filtro obligatorio (por defecto `ALL`). |
| REQ-09 | Puntos de extensión solo-diseño (sin implementación en MVP): puerto conceptual `RecipeRecommendationEnhancer` (futuro flujo LLM/IA) y una forma futura de entrada `UserPreferences` (`preferredCuisines, excludedIngredients, diet, allergies, maxPreparationTime, difficulty, budget`). Documentarlos; no construirlos. |
| REQ-10 | Las APIs/casos representan casos de uso reales — sin endpoints CRUD inventados solo por seguir CRUD (aplicado en la spec 11). |

## Dependencias

- `06-domain-layer`, `02-architecture-foundation`.

## Criterios de aceptación

- [ ] Los 16 casos de uso existen, son testeables de forma independiente con puertos mockeados y cubren verificaciones de autorización para datos de usuario.
- [ ] Ningún caso de uso importa Supabase/Gemini/Next.js.
- [ ] `FindRecipesFromPantry` sin cuisine devuelve resultados multi-cocina (cuisine opcional).
- [ ] Los puntos de extensión de REQ-09 existen como interfaces/stubs documentados — cero lógica de IA entregada.

## Verificación

Tests unitarios por caso de uso con repositorios mockeados (suite de aplicación en la spec 16).
