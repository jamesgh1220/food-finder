-- 002_rls_policies.sql
-- Row Level Security for every table (SPEC 04, REQ-01..REQ-07).
-- Runs after 001_initial_schema.sql.
--
-- Rules encoded here:
--   REQ-01 profiles          : owner-only read/write.
--   REQ-02 pantry_items      : owner-only read/write.
--   REQ-03 favorite_recipes  : owner-only read/write.
--   REQ-04 recipes           : authenticated read; no write policies (writes denied).
--   REQ-05 ingredients       : authenticated read; no write policies (writes denied).
--   REQ-06 cuisines          : authenticated read; no write policies (writes denied).
--   REQ-07 recipe_ingredients: authenticated read; no write policies (writes denied)
--                              + RLS enabled on ALL tables above.
--
-- With RLS enabled and no matching policy, a query is denied: that is how
-- unauthenticated callers and cross-user access are rejected. auth.uid()
-- returns NULL for unauthenticated sessions, so `id = auth.uid()` is never
-- true for them.

-- ---------------------------------------------------------------------------
-- Enable RLS on every table
-- ---------------------------------------------------------------------------
ALTER TABLE profiles ENABLE ROW LEVEL SECURITY;
ALTER TABLE pantry_items ENABLE ROW LEVEL SECURITY;
ALTER TABLE favorite_recipes ENABLE ROW LEVEL SECURITY;
ALTER TABLE recipes ENABLE ROW LEVEL SECURITY;
ALTER TABLE ingredients ENABLE ROW LEVEL SECURITY;
ALTER TABLE cuisines ENABLE ROW LEVEL SECURITY;
ALTER TABLE recipe_ingredients ENABLE ROW LEVEL SECURITY;

-- ---------------------------------------------------------------------------
-- profiles (REQ-01): own row only
-- ---------------------------------------------------------------------------
DROP POLICY IF EXISTS profiles_select_own ON profiles;
CREATE POLICY profiles_select_own ON profiles
  FOR SELECT TO authenticated
  USING (id = auth.uid());

DROP POLICY IF EXISTS profiles_insert_own ON profiles;
CREATE POLICY profiles_insert_own ON profiles
  FOR INSERT TO authenticated
  WITH CHECK (id = auth.uid());

DROP POLICY IF EXISTS profiles_update_own ON profiles;
CREATE POLICY profiles_update_own ON profiles
  FOR UPDATE TO authenticated
  USING (id = auth.uid())
  WITH CHECK (id = auth.uid());

DROP POLICY IF EXISTS profiles_delete_own ON profiles;
CREATE POLICY profiles_delete_own ON profiles
  FOR DELETE TO authenticated
  USING (id = auth.uid());

-- ---------------------------------------------------------------------------
-- pantry_items (REQ-02): own rows only
-- ---------------------------------------------------------------------------
DROP POLICY IF EXISTS pantry_items_select_own ON pantry_items;
CREATE POLICY pantry_items_select_own ON pantry_items
  FOR SELECT TO authenticated
  USING (user_id = auth.uid());

DROP POLICY IF EXISTS pantry_items_insert_own ON pantry_items;
CREATE POLICY pantry_items_insert_own ON pantry_items
  FOR INSERT TO authenticated
  WITH CHECK (user_id = auth.uid());

DROP POLICY IF EXISTS pantry_items_update_own ON pantry_items;
CREATE POLICY pantry_items_update_own ON pantry_items
  FOR UPDATE TO authenticated
  USING (user_id = auth.uid())
  WITH CHECK (user_id = auth.uid());

DROP POLICY IF EXISTS pantry_items_delete_own ON pantry_items;
CREATE POLICY pantry_items_delete_own ON pantry_items
  FOR DELETE TO authenticated
  USING (user_id = auth.uid());

-- ---------------------------------------------------------------------------
-- favorite_recipes (REQ-03): own rows only
-- ---------------------------------------------------------------------------
DROP POLICY IF EXISTS favorite_recipes_select_own ON favorite_recipes;
CREATE POLICY favorite_recipes_select_own ON favorite_recipes
  FOR SELECT TO authenticated
  USING (user_id = auth.uid());

DROP POLICY IF EXISTS favorite_recipes_insert_own ON favorite_recipes;
CREATE POLICY favorite_recipes_insert_own ON favorite_recipes
  FOR INSERT TO authenticated
  WITH CHECK (user_id = auth.uid());

DROP POLICY IF EXISTS favorite_recipes_update_own ON favorite_recipes;
CREATE POLICY favorite_recipes_update_own ON favorite_recipes
  FOR UPDATE TO authenticated
  USING (user_id = auth.uid())
  WITH CHECK (user_id = auth.uid());

DROP POLICY IF EXISTS favorite_recipes_delete_own ON favorite_recipes;
CREATE POLICY favorite_recipes_delete_own ON favorite_recipes
  FOR DELETE TO authenticated
  USING (user_id = auth.uid());

-- ---------------------------------------------------------------------------
-- recipes (REQ-04): authenticated read only; NO write policies
-- ---------------------------------------------------------------------------
DROP POLICY IF EXISTS recipes_select_authenticated ON recipes;
CREATE POLICY recipes_select_authenticated ON recipes
  FOR SELECT TO authenticated
  USING (true);

-- ---------------------------------------------------------------------------
-- ingredients (REQ-05): authenticated read only; NO write policies
-- ---------------------------------------------------------------------------
DROP POLICY IF EXISTS ingredients_select_authenticated ON ingredients;
CREATE POLICY ingredients_select_authenticated ON ingredients
  FOR SELECT TO authenticated
  USING (true);

-- ---------------------------------------------------------------------------
-- cuisines (REQ-06): authenticated read only; NO write policies
-- ---------------------------------------------------------------------------
DROP POLICY IF EXISTS cuisines_select_authenticated ON cuisines;
CREATE POLICY cuisines_select_authenticated ON cuisines
  FOR SELECT TO authenticated
  USING (true);

-- ---------------------------------------------------------------------------
-- recipe_ingredients (REQ-07): authenticated read only; NO write policies
-- (junction of two catalogs; readable wherever recipes/ingredients are)
-- ---------------------------------------------------------------------------
DROP POLICY IF EXISTS recipe_ingredients_select_authenticated ON recipe_ingredients;
CREATE POLICY recipe_ingredients_select_authenticated ON recipe_ingredients
  FOR SELECT TO authenticated
  USING (true);
