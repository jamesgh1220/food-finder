-- Recipe ingredient optionality is needed for accurate recommendation results.
-- Existing recipe relations remain required by default for backward compatibility.
ALTER TABLE recipe_ingredients
  ADD COLUMN IF NOT EXISTS optional BOOLEAN NOT NULL DEFAULT FALSE;
