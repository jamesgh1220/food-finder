import { existsSync, readFileSync, readdirSync } from "node:fs";
import { resolve } from "node:path";
import { describe, expect, it } from "vitest";
import { normalizeIngredientName } from "@/domain/normalization/ingredient-normalizer";
import { MEAL_TYPES } from "@/domain/value-objects";

/**
 * Seed data contract (spec 15, REQ-01..REQ-06).
 *
 * The seed lives in versioned SQL migrations, so these tests parse the `VALUES`
 * blocks of those files and pin the acceptance criteria of the spec: multicultural
 * coverage, pantry staples, referential integrity, matching-friendly data
 * (fully matched + incomplete recipes), the multi-country search scenario and the
 * idempotency guards.
 */

type Cell = string | number | boolean | null;
type Row = Record<string, Cell>;

const MIGRATIONS_DIR = resolve(process.cwd(), "supabase/migrations");

const SEED_FILES = {
  cuisines: "004_seed_cuisines.sql",
  ingredients: "005_seed_ingredients.sql",
  recipes: "006_seed_recipes.sql",
  recipeIngredients: "007_seed_recipe_ingredients.sql",
} as const;

const REQUIRED_SEED_ORDER = [
  SEED_FILES.cuisines,
  SEED_FILES.ingredients,
  SEED_FILES.recipes,
  SEED_FILES.recipeIngredients,
];

/** Pantry staples plus a few raw ingredients (mirrors the demo flow). */
const TYPICAL_PANTRY = [
  "papa",
  "huevo",
  "tomate",
  "cebolla",
  "ajo",
  "arroz blanco",
  "aceite de oliva",
  "pollo",
  "carne de res",
];

const REQUIRED_CUISINES: ReadonlyArray<{ slug: string; country: string }> = [
  { slug: "colombia", country: "Colombia" },
  { slug: "peru", country: "Perú" },
  { slug: "argentina", country: "Argentina" },
  { slug: "mexico", country: "México" },
  { slug: "espana", country: "España" },
  { slug: "italia", country: "Italia" },
];

const REQUIRED_STAPLES = ["sal", "pimienta", "aceite", "azúcar", "agua"];

function readSeedFile(fileName: string): string {
  return readFileSync(resolve(MIGRATIONS_DIR, fileName), "utf8");
}

/** Drop full-line SQL comments so keyword scanning never sees prose. */
function stripLineComments(sql: string): string {
  return sql
    .split(/\r?\n/)
    .filter((line) => !line.trimStart().startsWith("--"))
    .join("\n");
}

/** Read a quoted SQL literal; `escapes` enables E'' backslash escapes. */
function readQuotedLiteral(
  input: string,
  quoteIndex: number,
  escapes: boolean,
): [string, number] {
  let value = "";
  let index = quoteIndex + 1;

  while (index < input.length) {
    const char = input[index];

    if (escapes && char === "\\") {
      const next = input[index + 1];
      value += next === "n" ? "\n" : next === "t" ? "\t" : next;
      index += 2;
      continue;
    }

    if (char === "'") {
      if (input[index + 1] === "'") {
        value += "'";
        index += 2;
        continue;
      }
      return [value, index + 1];
    }

    value += char;
    index += 1;
  }

  throw new Error("Unterminated SQL string literal in seed migration.");
}

function parseBareWord(word: string): Cell {
  const upper = word.toUpperCase();
  if (upper === "NULL") return null;
  if (upper === "TRUE") return true;
  if (upper === "FALSE") return false;
  if (/^-?\d+(\.\d+)?$/.test(word)) return Number(word);
  throw new Error(`Unsupported SQL literal in seed data: ${word}`);
}

type Token =
  | { kind: "open" }
  | { kind: "close" }
  | { kind: "comma" }
  | { kind: "value"; value: Cell };

function tokenizeValues(body: string): Token[] {
  const tokens: Token[] = [];
  let index = 0;

  while (index < body.length) {
    const char = body[index];

    if (/\s/.test(char)) {
      index += 1;
      continue;
    }
    if (char === "(") {
      tokens.push({ kind: "open" });
      index += 1;
      continue;
    }
    if (char === ")") {
      tokens.push({ kind: "close" });
      index += 1;
      continue;
    }
    if (char === ",") {
      tokens.push({ kind: "comma" });
      index += 1;
      continue;
    }
    if (char === "'") {
      const [value, next] = readQuotedLiteral(body, index, false);
      tokens.push({ kind: "value", value });
      index = next;
      continue;
    }
    if ((char === "E" || char === "e") && body[index + 1] === "'") {
      const [value, next] = readQuotedLiteral(body, index + 1, true);
      tokens.push({ kind: "value", value });
      index = next;
      continue;
    }

    let end = index;
    while (end < body.length && !/[\s,()]/.test(body[end])) end += 1;
    tokens.push({
      kind: "value",
      value: parseBareWord(body.slice(index, end)),
    });
    index = end;
  }

  return tokens;
}

/** Parse the single `FROM (VALUES ...) AS v(columns)` block of a seed file. */
function parseSeedRows(fileName: string): Row[] {
  const source = stripLineComments(readSeedFile(fileName));
  const valuesMatch = source.match(/FROM\s*\(\s*VALUES/i);

  if (!valuesMatch || valuesMatch.index === undefined) {
    throw new Error(`${fileName}: no VALUES block found.`);
  }

  const tableStart = valuesMatch.index;
  const bodyStart = tableStart + valuesMatch[0].length;
  const aliasMatch = source
    .slice(tableStart)
    .match(/\)\s*AS\s+v\s*\(([^)]*)\)/i);

  if (!aliasMatch || aliasMatch.index === undefined) {
    throw new Error(`${fileName}: no column alias found.`);
  }

  const body = source.slice(bodyStart, tableStart + aliasMatch.index);
  const columns = aliasMatch[1].split(",").map((column) => column.trim());
  const tokens = tokenizeValues(body);
  const rows: Row[] = [];
  let index = 0;

  while (index < tokens.length) {
    const token = tokens[index];

    if (token.kind === "comma") {
      index += 1;
      continue;
    }
    if (token.kind !== "open") {
      throw new Error(
        `${fileName}: expected a row tuple, found ${token.kind}.`,
      );
    }

    const values: Cell[] = [];
    let expectValue = true;
    index += 1;

    while (index < tokens.length && tokens[index].kind !== "close") {
      const current = tokens[index];

      if (current.kind === "comma") {
        if (expectValue) values.push(null);
        expectValue = true;
        index += 1;
        continue;
      }
      if (current.kind !== "value") {
        throw new Error(`${fileName}: unexpected nested tuple in a row.`);
      }

      values.push(current.value);
      expectValue = false;
      index += 1;
    }

    index += 1;

    if (values.length !== columns.length) {
      throw new Error(
        `${fileName}: row with ${values.length} values for ${columns.length} columns.`,
      );
    }

    rows.push(
      Object.fromEntries(columns.map((column, i) => [column, values[i]])),
    );
  }

  return rows;
}

function text(row: Row, column: string): string {
  const value = row[column];
  if (typeof value !== "string") {
    throw new Error(`Column ${column} is not text: ${String(value)}`);
  }
  return value;
}

function flag(row: Row, column: string): boolean {
  const value = row[column];
  if (typeof value !== "boolean") {
    throw new Error(`Column ${column} is not boolean: ${String(value)}`);
  }
  return value;
}

interface SeedData {
  cuisines: Row[];
  ingredients: Row[];
  recipes: Row[];
  recipeIngredients: Row[];
  cuisineBySlug: Map<string, Row>;
  ingredientByName: Map<string, Row>;
  recipeBySlug: Map<string, Row>;
  relationsByRecipe: Map<string, Row[]>;
}

let cachedSeedData: SeedData | null = null;

/** Parse the seed migrations once, on first use inside a test. */
function seedData(): SeedData {
  if (cachedSeedData) return cachedSeedData;

  const cuisines = parseSeedRows(SEED_FILES.cuisines);
  const ingredients = parseSeedRows(SEED_FILES.ingredients);
  const recipes = parseSeedRows(SEED_FILES.recipes);
  const recipeIngredients = parseSeedRows(SEED_FILES.recipeIngredients);

  const relationsByRecipe = new Map<string, Row[]>();
  for (const relation of recipeIngredients) {
    const slug = text(relation, "recipe_slug");
    relationsByRecipe.set(slug, [
      ...(relationsByRecipe.get(slug) ?? []),
      relation,
    ]);
  }

  cachedSeedData = {
    cuisines,
    ingredients,
    recipes,
    recipeIngredients,
    cuisineBySlug: new Map(cuisines.map((row) => [text(row, "slug"), row])),
    ingredientByName: new Map(
      ingredients.map((row) => [text(row, "normalized_name"), row]),
    ),
    recipeBySlug: new Map(recipes.map((row) => [text(row, "slug"), row])),
    relationsByRecipe,
  };

  return cachedSeedData;
}

/** Mirror of the repository ingredient search (`normalized_name ILIKE %term%`). */
function matchingIngredientNames(term: string): string[] {
  return [...seedData().ingredientByName.keys()].filter((name) =>
    name.includes(term),
  );
}

describe("seed migrations are versioned (REQ-06)", () => {
  it("ships the four seed migrations in apply order alongside the schema", () => {
    const files = readdirSync(MIGRATIONS_DIR).filter((file) =>
      file.endsWith(".sql"),
    );

    for (const fileName of REQUIRED_SEED_ORDER) {
      expect(files).toContain(fileName);
    }

    const seedFiles = files.filter((file) => file.includes("_seed_")).sort();
    expect(seedFiles).toEqual([...REQUIRED_SEED_ORDER].sort());

    const numbers = REQUIRED_SEED_ORDER.map((file) =>
      Number(file.slice(0, 3)),
    ).sort((left, right) => left - right);
    expect(numbers[0]).toBeGreaterThan(3);
  });

  it("does not rely on an ad-hoc supabase/seed.sql", () => {
    expect(existsSync(resolve(process.cwd(), "supabase/seed.sql"))).toBe(false);
  });

  it("keeps every seed migration self-guarded so re-applying cannot duplicate rows", () => {
    expect(readSeedFile(SEED_FILES.cuisines)).toMatch(
      /ON CONFLICT \(slug\) DO UPDATE/i,
    );
    expect(readSeedFile(SEED_FILES.ingredients)).toMatch(/WHERE NOT EXISTS/i);
    expect(readSeedFile(SEED_FILES.recipes)).toMatch(
      /ON CONFLICT \(slug\) DO UPDATE/i,
    );
    expect(readSeedFile(SEED_FILES.recipeIngredients)).toMatch(
      /ON CONFLICT \(recipe_id, ingredient_id\) DO UPDATE/i,
    );
  });
});

describe("multicultural cuisine catalog (REQ-01, REQ-02)", () => {
  it("seeds at least six cuisines with unique, URL-safe slugs", () => {
    const { cuisines } = seedData();
    expect(cuisines.length).toBeGreaterThanOrEqual(6);

    const slugs = cuisines.map((row) => text(row, "slug"));
    expect(new Set(slugs).size).toBe(slugs.length);
    for (const slug of slugs) {
      expect(slug).toMatch(/^[a-z0-9-]+$/);
    }
  });

  it("covers the six cuisines named by the spec with their country", () => {
    const { cuisineBySlug } = seedData();

    for (const expected of REQUIRED_CUISINES) {
      const cuisine = cuisineBySlug.get(expected.slug);
      expect(cuisine, `missing cuisine ${expected.slug}`).toBeDefined();
      expect(text(cuisine as Row, "country")).toBe(expected.country);
      expect(text(cuisine as Row, "name").length).toBeGreaterThan(0);
      expect(text(cuisine as Row, "region").length).toBeGreaterThan(0);
      expect(text(cuisine as Row, "description").length).toBeGreaterThan(0);
    }
  });

  it("seeds recipes for every cuisine and never only for Colombia", () => {
    const { recipes } = seedData();

    for (const { slug } of REQUIRED_CUISINES) {
      const count = recipes.filter(
        (row) => text(row, "cuisine_slug") === slug,
      ).length;
      expect(count, `cuisine ${slug} has no recipes`).toBeGreaterThan(0);
    }

    const colombian = recipes.filter(
      (row) => text(row, "cuisine_slug") === "colombia",
    ).length;
    expect(colombian).toBeLessThan(recipes.length);
  });
});

describe("ingredient catalog (REQ-03)", () => {
  it("matches the domain normalizer for every seeded ingredient", () => {
    const { ingredients } = seedData();

    for (const row of ingredients) {
      const name = text(row, "name");
      const normalized = text(row, "normalized_name");
      expect(normalized).toBe(normalizeIngredientName(name));
      expect(normalized.length).toBeGreaterThan(0);
    }
  });

  it("has no duplicated normalized names", () => {
    const { ingredients } = seedData();
    const names = ingredients.map((row) => text(row, "normalized_name"));
    expect(new Set(names).size).toBe(names.length);
  });

  it("flags the five pantry staples", () => {
    const { ingredients } = seedData();
    const staples = ingredients
      .filter((row) => flag(row, "is_pantry_staple"))
      .map((row) => text(row, "normalized_name"));

    for (const staple of REQUIRED_STAPLES) {
      expect(staples, `staple ${staple} is not flagged`).toContain(staple);
    }
  });

  it("categorizes every ingredient", () => {
    const { ingredients } = seedData();

    for (const row of ingredients) {
      expect(text(row, "category").length).toBeGreaterThan(0);
    }
  });
});

describe("seeded recipes (REQ-04)", () => {
  it("links every recipe to a seeded cuisine with a consistent country/region", () => {
    const { recipes, cuisineBySlug } = seedData();

    for (const row of recipes) {
      const cuisine = cuisineBySlug.get(text(row, "cuisine_slug"));
      expect(cuisine, `unknown cuisine for ${text(row, "slug")}`).toBeDefined();
      expect(text(row, "country")).toBe(text(cuisine as Row, "country"));
      expect(text(row, "region")).toBe(text(cuisine as Row, "region"));
    }
  });

  it("uses valid meal types and the INTERNAL source the recommendation catalog filters on", () => {
    const { recipes } = seedData();

    for (const row of recipes) {
      expect(MEAL_TYPES as readonly string[]).toContain(text(row, "meal_type"));
      expect(text(row, "source")).toBe("INTERNAL");
      expect(row.source_url).toBeNull();
    }
  });

  it("keeps slugs unique and kebab-cased", () => {
    const { recipes } = seedData();
    const slugs = recipes.map((row) => text(row, "slug"));
    expect(new Set(slugs).size).toBe(slugs.length);
    for (const slug of slugs) {
      expect(slug).toMatch(/^[a-z0-9]+(-[a-z0-9]+)*$/);
    }
  });

  it("describes each recipe with instructions, times, servings and difficulty", () => {
    const { recipes } = seedData();

    for (const row of recipes) {
      const slug = text(row, "slug");
      expect(text(row, "name").length, `${slug} has no name`).toBeGreaterThan(
        0,
      );
      expect(
        text(row, "description").length,
        `${slug} has no description`,
      ).toBeGreaterThan(0);

      const steps = text(row, "instructions")
        .split("\n")
        .map((step) => step.trim())
        .filter((step) => step.length > 0);
      expect(steps.length, `${slug} has too few steps`).toBeGreaterThanOrEqual(
        3,
      );

      expect(Number(row.preparation_time), `${slug} prep time`).toBeGreaterThan(
        0,
      );
      expect(row.cooking_time === null || Number(row.cooking_time) >= 0).toBe(
        true,
      );
      expect(Number(row.servings), `${slug} servings`).toBeGreaterThanOrEqual(
        1,
      );
      expect(["EASY", "MEDIUM", "HARD"]).toContain(text(row, "difficulty"));
    }
  });

  it("does not seed external images", () => {
    const { recipes } = seedData();

    for (const row of recipes) {
      expect(row.image_url).toBeNull();
    }
  });
});

describe("recipe ingredients (REQ-04)", () => {
  it("gives every recipe at least two relations with resolvable references", () => {
    const { recipes, recipeBySlug, ingredientByName, relationsByRecipe } =
      seedData();

    for (const row of recipes) {
      const slug = text(row, "slug");
      const relations = relationsByRecipe.get(slug) ?? [];
      expect(
        relations.length,
        `${slug} has no ingredients`,
      ).toBeGreaterThanOrEqual(2);

      for (const relation of relations) {
        expect(
          recipeBySlug.has(text(relation, "recipe_slug")),
          `${slug} references an unknown recipe`,
        ).toBe(true);
        expect(
          ingredientByName.has(text(relation, "ingredient_normalized")),
          `${slug} references an unknown ingredient`,
        ).toBe(true);
      }
    }
  });

  it("keeps at most one relation per recipe/ingredient pair", () => {
    const { recipeIngredients } = seedData();
    const keys = recipeIngredients.map(
      (row) =>
        `${text(row, "recipe_slug")}::${text(row, "ingredient_normalized")}`,
    );
    expect(new Set(keys).size).toBe(keys.length);
  });

  it("marks optional ingredients and keeps every recipe with required ones", () => {
    const { recipes, recipeIngredients, relationsByRecipe } = seedData();
    const optional = recipeIngredients.filter((row) => flag(row, "optional"));
    expect(optional.length).toBeGreaterThan(0);

    for (const row of recipes) {
      const slug = text(row, "slug");
      const required = (relationsByRecipe.get(slug) ?? []).filter(
        (relation) => !flag(relation, "optional"),
      );
      expect(
        required.length,
        `${slug} has no required ingredient`,
      ).toBeGreaterThan(0);
    }
  });

  it("carries quantity and unit for every relation, using al gusto for staples", () => {
    const { recipeIngredients, ingredientByName } = seedData();

    for (const relation of recipeIngredients) {
      const unit = text(relation, "unit");
      expect(unit.length).toBeGreaterThan(0);

      const ingredient = ingredientByName.get(
        text(relation, "ingredient_normalized"),
      ) as Row;

      if (flag(ingredient, "is_pantry_staple")) {
        expect(unit).toBe("al gusto");
        expect(relation.quantity).toBeNull();
      } else {
        expect(Number(relation.quantity)).toBeGreaterThan(0);
      }
    }
  });
});

describe("matching exercise (REQ-04)", () => {
  function missingRequired(slug: string): string[] {
    const { relationsByRecipe, ingredientByName } = seedData();

    return (relationsByRecipe.get(slug) ?? [])
      .filter((relation) => !flag(relation, "optional"))
      .map((relation) => text(relation, "ingredient_normalized"))
      .filter((name) => {
        const ingredient = ingredientByName.get(name) as Row;
        if (flag(ingredient, "is_pantry_staple")) return false;
        return !TYPICAL_PANTRY.includes(name);
      });
  }

  it("includes recipes fully covered by a typical pantry and recipes with gaps", () => {
    const { recipes } = seedData();
    const gaps = recipes.map((row) => missingRequired(text(row, "slug")));
    expect(gaps.some((missing) => missing.length === 0)).toBe(true);
    expect(gaps.some((missing) => missing.length > 0)).toBe(true);
  });

  it("covers papa, carne and huevo in lunch recipes of at least two countries", () => {
    const { recipes, recipeIngredients } = seedData();
    const terms = ["papa", "carne", "huevo"];

    for (const term of terms) {
      expect(
        matchingIngredientNames(term).length,
        `no ingredient matches ${term}`,
      ).toBeGreaterThan(0);
    }

    const matchedIngredients = new Set(
      terms.flatMap((term) => matchingIngredientNames(term)),
    );
    const matchedSlugs = new Set(
      recipeIngredients
        .filter((relation) =>
          matchedIngredients.has(text(relation, "ingredient_normalized")),
        )
        .map((relation) => text(relation, "recipe_slug")),
    );

    const countries = new Set(
      recipes
        .filter(
          (row) =>
            matchedSlugs.has(text(row, "slug")) &&
            text(row, "meal_type") === "LUNCH",
        )
        .map((row) => text(row, "country")),
    );

    expect(countries.size).toBeGreaterThanOrEqual(2);
    expect([...countries]).toEqual(
      expect.arrayContaining(["Colombia", "Perú"]),
    );
  });
});

describe("content licensing (REQ-05)", () => {
  it("documents the origin of the seeded content", () => {
    const doc = resolve(
      process.cwd(),
      "docs/specs/15-seed-data/CONTENT-ORIGIN.md",
    );
    expect(existsSync(doc)).toBe(true);
    expect(readFileSync(doc, "utf8")).toMatch(/original/i);
  });

  it("copies no external recipe source into the seed", () => {
    for (const fileName of REQUIRED_SEED_ORDER) {
      expect(readSeedFile(fileName)).not.toMatch(/https?:\/\//i);
    }
  });
});
