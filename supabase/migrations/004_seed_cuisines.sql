-- 004_seed_cuisines.sql
-- Seed del catálogo de cocinas (spec 15, REQ-01/REQ-02/REQ-06).
-- Contenido original creado para Food Finder; ver docs/specs/15-seed-data/CONTENT-ORIGIN.md
-- (spec 15, REQ-05). Idempotente: `slug` es UNIQUE, así que reaplicar actualiza sin duplicar.
-- Idempotente y ordenada: se aplica después de 001..003 (esquema + RLS).

INSERT INTO cuisines (name, slug, country, region, description)
SELECT
  v.name::text,
  v.slug::text,
  v.country::text,
  v.region::text,
  v.description::text
FROM (VALUES
  ('Colombia', 'colombia', 'Colombia', 'América del Sur', 'Cocina andina, caribeña y pacífica: arepas, tubérculos, fríjoles y sopas de papa.'),
  ('Perú', 'peru', 'Perú', 'América del Sur', 'Cocina costeña y andina con ají amarillo, papa y arroz; sabores intensos de mestizaje.'),
  ('Argentina', 'argentina', 'Argentina', 'América del Sur', 'Cocina rioplatense y pampeana: carnes, milanesas, empanadas y chimichurri.'),
  ('México', 'mexico', 'México', 'América del Norte', 'Cocina de maíz, fríjol y chile: tortillas, salsas y guisos de todos los días.'),
  ('España', 'espana', 'España', 'Europa', 'Cocina mediterránea de aceite de oliva, huevo y papa: tortillas, guisos y sopas frías.'),
  ('Italia', 'italia', 'Italia', 'Europa', 'Cocina regional de pasta, arroz y huevo: pocos ingredientes y mucha técnica.')
) AS v(name, slug, country, region, description)
ON CONFLICT (slug) DO UPDATE SET
  name = EXCLUDED.name,
  country = EXCLUDED.country,
  region = EXCLUDED.region,
  description = EXCLUDED.description,
  updated_at = NOW();
