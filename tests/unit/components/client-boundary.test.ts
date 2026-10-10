import { readFileSync, readdirSync, statSync } from "node:fs";
import { join } from "node:path";
import { describe, expect, it } from "vitest";

/**
 * Client/server boundary audit (spec 12, REQ-01).
 *
 * Pure source inspection — no DOM. Verifies that the Server Component entry
 * point and the server-safe primitives stay free of the `"use client"`
 * directive, that the interactive components opt in, and that no global state
 * library is pulled into the app.
 */

const ROOT = process.cwd();

const read = (relativePath: string): string =>
  readFileSync(join(ROOT, relativePath), "utf8");

const isClientComponent = (source: string): boolean =>
  /^['"]use client['"]/.test(source.trimStart());

function collectSourceFiles(dir: string): string[] {
  const files: string[] = [];
  for (const entry of readdirSync(dir)) {
    const full = join(dir, entry);
    if (statSync(full).isDirectory()) {
      files.push(...collectSourceFiles(full));
    } else if (full.endsWith(".ts") || full.endsWith(".tsx")) {
      files.push(full);
    }
  }
  return files;
}

const SERVER_SAFE = [
  "src/app/page.tsx",
  "src/components/ui/button.tsx",
  "src/components/recipes/recipe-card.tsx",
  "src/components/shared/empty-state.tsx",
];

const CLIENT_ONLY = [
  "src/components/ingredients/ingredient-search.tsx",
  "src/components/favorites/favorite-button.tsx",
  "src/components/filters/meal-type-selector.tsx",
];

describe("client/server boundary", () => {
  it("keeps the Server Component entry point and server-safe primitives free of 'use client'", () => {
    for (const path of SERVER_SAFE) {
      expect(
        isClientComponent(read(path)),
        `${path} must not opt into the client boundary`,
      ).toBe(false);
    }
  });

  it("marks the interactive components as Client Components", () => {
    for (const path of CLIENT_ONLY) {
      expect(
        isClientComponent(read(path)),
        `${path} must declare "use client"`,
      ).toBe(true);
    }
  });

  it("does not import a global state library anywhere under src/", () => {
    const forbidden = /["'](redux|zustand|jotai)(?:\/[^"']*)?["']/;
    const offenders = collectSourceFiles(join(ROOT, "src")).filter((file) =>
      forbidden.test(readFileSync(file, "utf8")),
    );

    expect(offenders).toEqual([]);
  });
});
