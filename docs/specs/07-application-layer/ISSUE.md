# ISSUE: 07 — Application Layer

## Título

Implementar los 16 casos de uso de la capa application con DTOs, autorización y puertos de extensión futura

## Descripción

La capa application coordina todo: 16 casos de uso mínimos (auth, pantry, recipes, cuisine, favorites), sus DTOs, la autorización a nivel de caso de uso y los puntos de extensión futuros (IA y preferencias de usuario) que deben quedar **diseñados pero no implementados**. Es el contrato que conecta la UI/API con el dominio.

## Objetivo

Todos los flujos del MVP expresados como casos de uso testeables, con autorización propia y dependencia solo de puertos, listos para ser consumidos por Route Handlers y Server Components.

## Alcance

- 16 casos de uso según PROMTP #13 (4 auth, 5 pantry, 4 recipes, 2 cuisine, 3 favorites).
- DTOs de entrada/salida y orquestación de repositorios/servicios.
- Autorización dentro del caso de uso (datos de usuario verificados en servidor).
- Regla: `cuisine` opcional en `FindRecipesFromPantry` (default ALL).
- Extension points documentados: `RecipeRecommendationEnhancer` (futuro IA) y forma de `UserPreferences` futura.

**Fuera de alcance:** internals del motor de recomendación (spec 10), exposición HTTP (spec 11), adapters concretos (spec 08).

## Casos de prueba

1. Cada caso de uso pasa tests unitarios con repositorios mockeados.
2. `AddPantryIngredient` asocia la fila al usuario autenticado — nunca a otro userId.
3. `FindRecipesFromPantry` sin cuisine devuelve recetas de múltiples gastronomías.
4. `GetUserPantry`/`GetFavoriteRecipes` solo retornan datos del usuario de la sesión.
5. `ClearUserPantry` elimina solo filas del usuario.
6. Los stubs de IA/preferencias compilan pero no ejecutan lógica.

## Consideraciones técnicas

- La autorización a nivel de caso de uso es defensa en profundidad junto con RLS (spec 04), no su reemplazo.
- No implementar IA (#73) ni preferencias completas (#87): solo interfaces/documentación.
- Mantener casos de uso pequeños y con nombres de acción claros; sin frameworks de caso de uso.

## Criterios de aceptación

- [ ] Los 16 casos de uso existen y están cableados en el composition root.
- [ ] Suite unitaria de aplicación verde con mocks (sin DB real).
- [ ] Verificación de pertenencia de usuario en todo caso de uso con datos de usuario.
- [ ] Cuisine opcional demostrado con test.
- [ ] Extension points futuros documentados e inertes.

## Resultado esperado

Capa de aplicación completa: 16 casos de uso autorizados y testeables, que la API (spec 11) y el frontend (specs 12–14) consumirán sin duplicar lógica de negocio.
