-- 005_seed_ingredients.sql
-- Seed del catálogo de ingredientes (spec 15, REQ-03/REQ-06).
-- Contenido original; ver docs/specs/15-seed-data/CONTENT-ORIGIN.md (spec 15, REQ-05).
-- `normalized_name` es la salida de normalizeIngredientName (trim + minúsculas +
-- colapso de espacios internos), sin quitar acentos: así la búsqueda del repositorio
-- (`normalized_name ILIKE %query%`) encuentra lo que el usuario escribe.
-- `normalized_name` no tiene constraint UNIQUE (spec 03 solo definió un índice), por
-- eso la idempotencia se garantiza con un guard WHERE NOT EXISTS.

INSERT INTO ingredients (name, normalized_name, category, is_pantry_staple)
SELECT
  v.name::text,
  v.normalized_name::text,
  v.category::text,
  v.is_pantry_staple::boolean
FROM (VALUES
  -- Básicos de despensa marcados como staples (REQ-03).
  ('Sal', 'sal', 'básico', TRUE),
  ('Pimienta', 'pimienta', 'básico', TRUE),
  ('Aceite', 'aceite', 'básico', TRUE),
  ('Azúcar', 'azúcar', 'básico', TRUE),
  ('Agua', 'agua', 'básico', TRUE),
  -- Verduras, tubérculos y hierbas.
  ('Papa', 'papa', 'verdura', FALSE),
  ('Cebolla', 'cebolla', 'verdura', FALSE),
  ('Cebolla larga', 'cebolla larga', 'verdura', FALSE),
  ('Cebolla china', 'cebolla china', 'verdura', FALSE),
  ('Tomate', 'tomate', 'verdura', FALSE),
  ('Ajo', 'ajo', 'verdura', FALSE),
  ('Zanahoria', 'zanahoria', 'verdura', FALSE),
  ('Arvejas', 'arvejas', 'verdura', FALSE),
  ('Mazorca', 'mazorca', 'verdura', FALSE),
  ('Pepino', 'pepino', 'verdura', FALSE),
  ('Espinaca', 'espinaca', 'verdura', FALSE),
  ('Ají amarillo', 'ají amarillo', 'verdura', FALSE),
  ('Chile', 'chile', 'verdura', FALSE),
  ('Pimentón', 'pimentón', 'verdura', FALSE),
  ('Plátano verde', 'plátano verde', 'verdura', FALSE),
  ('Cilantro', 'cilantro', 'verdura', FALSE),
  ('Perejil', 'perejil', 'verdura', FALSE),
  ('Albahaca', 'albahaca', 'verdura', FALSE),
  ('Romero', 'romero', 'verdura', FALSE),
  ('Guascas', 'guascas', 'verdura', FALSE),
  ('Jengibre', 'jengibre', 'verdura', FALSE),
  -- Frutas.
  ('Limón', 'limón', 'fruta', FALSE),
  -- Carnes y pescado.
  ('Pollo', 'pollo', 'carne', FALSE),
  ('Carne de res', 'carne de res', 'carne', FALSE),
  ('Chorizo', 'chorizo', 'carne', FALSE),
  ('Atún', 'atún', 'pescado', FALSE),
  -- Lácteos y huevo.
  ('Leche', 'leche', 'lácteo', FALSE),
  ('Queso', 'queso', 'lácteo', FALSE),
  ('Queso parmesano', 'queso parmesano', 'lácteo', FALSE),
  ('Mantequilla', 'mantequilla', 'lácteo', FALSE),
  ('Crema de leche', 'crema de leche', 'lácteo', FALSE),
  ('Huevo', 'huevo', 'huevo', FALSE),
  -- Granos, cereales y panadería.
  ('Fríjoles', 'fríjoles', 'grano', FALSE),
  ('Arroz blanco', 'arroz blanco', 'cereal', FALSE),
  ('Pasta', 'pasta', 'cereal', FALSE),
  ('Masa de maíz', 'masa de maíz', 'cereal', FALSE),
  ('Tortilla de maíz', 'tortilla de maíz', 'cereal', FALSE),
  ('Masa para empanadas', 'masa para empanadas', 'cereal', FALSE),
  ('Pan', 'pan', 'cereal', FALSE),
  ('Pan rallado', 'pan rallado', 'cereal', FALSE),
  -- Condimentos, salsas y grasas de sabor.
  ('Comino', 'comino', 'condimento', FALSE),
  ('Salsa de soya', 'salsa de soya', 'condimento', FALSE),
  ('Salsa de tomate', 'salsa de tomate', 'condimento', FALSE),
  ('Mayonesa', 'mayonesa', 'condimento', FALSE),
  ('Alcaparras', 'alcaparras', 'condimento', FALSE),
  ('Nueces', 'nueces', 'condimento', FALSE),
  ('Aceite de oliva', 'aceite de oliva', 'básico', FALSE),
  ('Vinagre', 'vinagre', 'condimento', FALSE),
  -- Bebidas.
  ('Vino blanco', 'vino blanco', 'bebida', FALSE),
  ('Caldo de verduras', 'caldo de verduras', 'básico', FALSE)
) AS v(name, normalized_name, category, is_pantry_staple)
WHERE NOT EXISTS (
  SELECT 1
  FROM ingredients existing
  WHERE existing.normalized_name = v.normalized_name
);
