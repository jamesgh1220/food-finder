import { defineConfig, globalIgnores } from "eslint/config";
import nextVitals from "eslint-config-next/core-web-vitals";
import nextTs from "eslint-config-next/typescript";
import prettier from "eslint-config-prettier/flat";

const eslintConfig = defineConfig([
  ...nextVitals,
  ...nextTs,
  // Must come after the Next configs so it wins over their stylistic rules.
  prettier,
  // REQ-02: the domain is pure. No framework, infrastructure, or UI imports,
  // and no global fetch (HTTP belongs to adapters, never to the domain).
  {
    files: ["src/domain/**/*.{ts,tsx}"],
    rules: {
      "no-restricted-imports": [
        "error",
        {
          patterns: [
            {
              group: [
                "next",
                "next/*",
                "react",
                "react/*",
                "react-dom",
                "react-dom/*",
                "@supabase/*",
                "spoonacular",
                "spoonacular/*",
                "@spoonacular/*",
                "@/app/*",
                "@/components/*",
                "@/infrastructure/*",
              ],
              message:
                "REQ-02: the domain layer must stay independent of Next.js, React, Supabase, Spoonacular, and UI/infrastructure. Depend on a port instead.",
            },
          ],
        },
      ],
      "no-restricted-globals": [
        "error",
        {
          name: "fetch",
          message:
            "REQ-02: the domain must not call fetch. HTTP lives in infrastructure adapters behind a port.",
        },
      ],
    },
  },
  // REQ-08 (spec 07): the application layer is pure. Use cases depend only on
  // ports/domain, never on framework, infrastructure, or UI code, and never
  // call the global fetch. Adapters are injected from the composition root.
  {
    files: ["src/application/**/*.{ts,tsx}"],
    rules: {
      "no-restricted-imports": [
        "error",
        {
          patterns: [
            {
              group: [
                "next",
                "next/*",
                "react",
                "react/*",
                "react-dom",
                "react-dom/*",
                "@supabase/*",
                "spoonacular",
                "spoonacular/*",
                "@spoonacular/*",
                "@/app/*",
                "@/components/*",
                "@/infrastructure/*",
              ],
              message:
                "REQ-08: the application layer must stay independent of Next.js, React, Supabase, Spoonacular, and UI/infrastructure. Depend on a port instead.",
            },
          ],
        },
      ],
      "no-restricted-globals": [
        "error",
        {
          name: "fetch",
          message:
            "REQ-08: the application layer must not call fetch. HTTP lives in infrastructure adapters behind a port.",
        },
      ],
    },
  },
  // REQ-11: Server Components invoke use cases directly; never fetch own /api/* routes.
  {
    files: ["src/app/**/*.{ts,tsx}"],
    rules: {
      "no-restricted-syntax": [
        "error",
        {
          selector:
            'CallExpression[callee.name="fetch"] > Literal[value=/^\\/api/]',
          message:
            "REQ-11: Server Components must call the use case directly, not fetch this app's own /api/* routes.",
        },
        {
          selector:
            'CallExpression[callee.name="fetch"] > TemplateLiteral[quasis.0.value.raw=/^\\/api/]',
          message:
            "REQ-11: Server Components must call the use case directly, not fetch this app's own /api/* routes.",
        },
      ],
    },
  },
  // Override default ignores of eslint-config-next.
  globalIgnores([
    // Default ignores of eslint-config-next:
    ".next/**",
    "out/**",
    "build/**",
    "next-env.d.ts",
  ]),
]);

export default eslintConfig;
