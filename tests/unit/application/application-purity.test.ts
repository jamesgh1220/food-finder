import { readdirSync, readFileSync, statSync } from "node:fs";
import { join } from "node:path";
import { describe, expect, it } from "vitest";

/**
 * Auditoría de pureza de la capa application (spec 07, REQ-08).
 *
 * La capa application no puede importar frameworks, infraestructura ni UI,
 * ni usar el `fetch` global. El lint ya lo aplica, pero este test lo verifica
 * de forma independiente leyendo los archivos reales (espejo del test de
 * pureza del dominio, spec 06).
 */

const APPLICATION_DIR = join(process.cwd(), "src", "application");

const FORBIDDEN_MODULES = [
  "next",
  "react",
  "react-dom",
  "@supabase/",
  "spoonacular",
  "@/app",
  "@/components",
  "@/infrastructure",
];

function listTypeScriptFiles(directory: string): string[] {
  return readdirSync(directory).flatMap((entry) => {
    const fullPath = join(directory, entry);
    if (statSync(fullPath).isDirectory()) {
      return listTypeScriptFiles(fullPath);
    }
    return fullPath.endsWith(".ts") ? [fullPath] : [];
  });
}

function isForbidden(moduleName: string): boolean {
  return FORBIDDEN_MODULES.some((forbidden) => {
    if (forbidden.endsWith("/")) {
      return (
        moduleName === forbidden.slice(0, -1) ||
        moduleName.startsWith(forbidden)
      );
    }
    // Los alias "@/" solo prohíben el prefijo exacto de carpeta: "@/app/*"
    // pero NO "@/application/*".
    if (forbidden.startsWith("@/")) {
      return moduleName === forbidden || moduleName.startsWith(`${forbidden}/`);
    }
    return moduleName === forbidden || moduleName.startsWith(`${forbidden}/`);
  });
}

/** Extrae los especificadores de todos los import/export del archivo. */
function importedModules(source: string): string[] {
  const modules: string[] = [];
  const pattern = /(?:from|import)\s*\(?\s*["']([^"']+)["']/g;
  let match: RegExpExecArray | null;
  while ((match = pattern.exec(source)) !== null) {
    modules.push(match[1]);
  }
  return modules;
}

describe("pureza de la capa application", () => {
  const files = listTypeScriptFiles(APPLICATION_DIR);

  it("encuentra archivos de application para auditar", () => {
    expect(files.length).toBeGreaterThan(0);
  });

  it("no importa frameworks, infraestructura ni UI", () => {
    for (const file of files) {
      const source = readFileSync(file, "utf8");
      for (const moduleName of importedModules(source)) {
        expect(
          isForbidden(moduleName),
          `${file} importa "${moduleName}"`,
        ).toBe(false);
      }
    }
  });

  it("no usa el fetch global", () => {
    for (const file of files) {
      const source = readFileSync(file, "utf8");
      expect(/\bfetch\s*\(/.test(source), `${file} usa fetch`).toBe(false);
    }
  });
});