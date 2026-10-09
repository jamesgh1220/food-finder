# SPEC: 15 — Datos de seed (catálogo multicultural)

**Fuente:** PROMTP.md #52 (Seed data), #53 (Copyright/contenido), #68 (Migraciones — ubicación del seed).

## Propósito

Sembrar el catálogo con contenido original y multicultural: cocinas, ingredientes y recetas internas de al menos seis gastronomías, para que la aplicación demuestre su principio multicocina desde el primer día.

## Alcance

### Dentro del alcance
- Migraciones/SQL de seed para `cuisines`, `ingredients`, `recipes`, `recipe_ingredients`.
- Reglas de contenido (originalidad/copyright).

### Fuera del alcance
- Definición del esquema (spec 03), datos de usuario, contenido externo (Gemini).

## Requisitos

| ID | Requisito |
|----|-----------|
| REQ-01 | El seed debe ser **multicultural**. NO sembrar solo recetas colombianas. Incluir un conjunto pequeño pero útil de distintas gastronomías. |
| REQ-02 | Cobertura mínima de cocinas con recetas de ejemplo: **Colombia** (huevos pericos, arepa con queso, calentado, changua, sudado de pollo, arroz con pollo, fríjoles, ajiaco, patacones, arepa con huevo), **Perú** (causa limeña, lomo saltado, ají de gallina, arroz chaufa), **Argentina** (milanesa, empanadas, choripán, carne al horno), **México** (tacos de carne, quesadillas, huevos rancheros, chilaquiles), **España** (tortilla española, patatas bravas, gazpacho), **Italia** (pasta al pomodoro, pasta aglio e olio, frittata, risotto). El dataset final del MVP puede ser menor — son ejemplos, no una cuota. |
| REQ-03 | Los ingredientes sembrados deben incluir staples con `is_pantry_staple = true` (sal, pimienta, aceite, azúcar, agua) además de los ingredientes que requieren las recetas del seed. |
| REQ-04 | Cada receta sembrada enlaza su fila en `cuisines` y sus filas en `recipe_ingredients` con cantidades/unidades/banderas `optional`; las recetas deben ejercitar el algoritmo de matching (algunas completamente coincidentes con los ingredientes sembrados, otras con faltantes). |
| REQ-05 | El contenido debe ser original, creado específicamente, basado en conocimiento culinario general o legalmente distribuible. **No** copiar recetas completas de sitios con copyright ni copiar masivamente contenido de sitios de recetas. Respetar las licencias de los proveedores externos para contenido externo. |
| REQ-06 | Los seeds viven como migraciones versionadas (p. ej. `003_seed_cuisines.sql`, `004_seed_recipes.sql`), coherentes con la política de migraciones de la spec 03 — no inserts manuales ad-hoc. |

## Dependencias

- `03-database-schema` (las tablas deben existir).

## Criterios de aceptación

- [ ] Aplicar las migraciones siembra ≥6 cocinas y un conjunto de recetas funcional que las abarque.
- [ ] Banderas `is_pantry_staple` presentes para sal/pimienta/aceite/azúcar/agua.
- [ ] Una búsqueda con `papa, carne, huevo` retorna coincidencias del seed de al menos dos países distintos.
- [ ] Todo el contenido sembrado pasa la regla de copyright (REQ-05) — origen documentado.
- [ ] Los seeds son migraciones repetibles, no inserts manuales solo en la nube.

## Verificación

Migración en base de datos nueva + la comprobación de búsqueda multicocina anterior (cubierta por los E2E de la spec 16).
