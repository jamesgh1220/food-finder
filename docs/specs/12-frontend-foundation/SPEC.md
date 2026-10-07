# SPEC: 12 — Base del frontend (landing, estándares UX, estado y primitivas de componentes)

**Fuente:** PROMTP.md #38 (Frontend), #39 (Landing page), #45 (Componentes), #46 (UX), #47 (State management), #48 (Server Components), #51 (Readiness i18n).

## Propósito

Fijar la experiencia y las reglas del frontend: sensación moderna mobile-first de app de descubrimiento de comida, la landing page, los primitivos de UI compartidos, los estándares UX (estados, accesibilidad) y la estrategia de estado/obtención de datos.

## Alcance

### Dentro del alcance
- Principios de diseño/UX para toda la app.
- Landing page en `/`.
- Componentes compartidos (todas las piezas reutilizables de PROMTP #45).
- Reglas de state management y de Server/Client Components.

### Fuera del alcance
- Páginas de dashboard/pantry (spec 13), recetas/detalle/favoritos (spec 14), shell de páginas de auth (spec 05).

## Requisitos

| ID | Requisito |
|----|-----------|
| REQ-01 | Experiencia moderna, limpia y mobile-first que se sienta como una **app de descubrimiento de comida**, no como un panel administrativo. |
| REQ-02 | Landing `/`: comunica "¿Qué puedo cocinar con lo que tengo?", CTA **Comenzar**, ejemplos visuales, explicación breve de: agrega tus ingredientes → elige qué quieres comer → descubre recetas → guarda tus favoritas. |
| REQ-03 | Componentes reutilizables: `IngredientSearch`, `IngredientSelector`, `PantryList`, `PantryItem`, `MealTypeSelector`, `CuisineSelector`, `RecipeCard`, `RecipeGrid`, `RecipeMatchScore`, `MissingIngredients`, `RecipeIngredients`, `RecipeInstructions`, `FavoriteButton`, `EmptyState`, `LoadingState`, `ErrorState`. Usar shadcn/ui donde sea apropiado; iconos de Lucide React. |
| REQ-04 | UX: mobile-first, responsive, accesible, rápida, clara, intuitiva. Estados de carga, estados vacíos, estados de error, skeletons donde tengan sentido, feedback al usuario, validaciones visibles. HTML semántico + buenas prácticas de accesibilidad. |
| REQ-05 | State management: **sin Redux**. Preferir Server Components, Server Actions cuando corresponda, React state, URL search params, React Hook Form. Evitar estado global innecesario. |
| REQ-06 | Client Components solo cuando se necesite interacción: estado local, eventos del navegador, formularios interactivos, APIs del browser. Todo lo demás permanece como Server Component. |
| REQ-07 | Readiness i18n: el copy de UI estructurado para poder añadir idiomas después; sin decisiones de dominio hardcodeadas. (i18n completo no requerido en el MVP.) |
| REQ-08 | Los formularios usan React Hook Form + Zod con feedback de validación visible. |

## Dependencias

- `01-project-scaffold`, `02-architecture-foundation`, `05-supabase-auth` (contexto de sesión para el shell protegido).

## Criterios de aceptación

- [ ] La landing renderiza en `/` con el mensaje exacto, el CTA y los 4 pasos explicados.
- [ ] Los 15 componentes de REQ-03 existen y se usan o exportan desde el árbol de componentes.
- [ ] Viewport móvil: sin overflow horizontal; targets táctiles utilizables.
- [ ] Toda vista de datos tiene estados de carga/vacío/error.
- [ ] Auditoría: sin boundaries `'use client'` innecesarios; sin librería de Redux/global state instalada.

## Verificación

Tests de componentes (RTL) para las primitivas + pase visual/manual de la landing; chequeo de accesibilidad (HTML semántico, labels).
