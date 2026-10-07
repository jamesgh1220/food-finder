import { defineConfig, configDefaults } from "vitest/config";
import react from "@vitejs/plugin-react";

export default defineConfig({
  plugins: [react()],
  resolve: {
    // Vite resolves `@/*` from tsconfig.json natively (no plugin needed).
    tsconfigPaths: true,
  },
  test: {
    environment: "jsdom",
    passWithNoTests: true,
    // Playwright specs live in e2e/ and must only run under `pnpm test:e2e`.
    exclude: [...configDefaults.exclude, "e2e/**"],
  },
});
