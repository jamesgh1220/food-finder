<!-- BEGIN:nextjs-agent-rules -->

## This is NOT the Next.js you know

This version has breaking changes — APIs, conventions, and file structure may all differ from your training data. Read the relevant guide in `node_modules/next/dist/docs/` (resolved from this file's directory; in monorepos the `next` package may not be visible from the repo root) before writing any code. Heed deprecation notices.

This block is written and re-added by `next dev` — verify at `node_modules/next/dist/server/lib/generate-agent-files.js`. Removing it from a diff only re-creates the uncommitted change; committing it with your work keeps the tree clean.

<!-- END:nextjs-agent-rules -->

# Food Finder — AI Agent Instructions

Food Finder answers one question: **"¿Qué puedo cocinar con lo que tengo?"** Every instruction below exists to keep AI-assisted work aligned with the master spec, the hexagonal architecture, and the visual identity of the product.

## Non-negotiables

1. **pnpm ONLY.** Never `npm`, `npx`, `yarn`, or `bun` for installs or scripts. The lockfile authority is `packageManager: pnpm@10.15.1`.
2. **Every view is built under the `minimalist-ui` skill** (see [Frontend design](#frontend-design--minimalist-ui-is-mandatory)).
3. **UI copy is in Spanish.** Code, identifiers, comments, and commit messages are in English.
4. **Read the master spec before implementing:** `docs/PROMTP.md`. Detailed specs live in `docs/specs/01..17`.
5. **No overengineering.** If a change is not required by the spec, do not add it (no Redis, GraphQL, global state libs, AI in the MVP).

## Commands

| Task | Command |
|------|---------|
| Dev server | `pnpm dev` |
| Build | `pnpm build` |
| Lint | `pnpm lint` |
| Typecheck | `pnpm typecheck` |
| Unit tests | `pnpm test` |
| E2E tests | `pnpm test:e2e` |
| Format | `pnpm format` |
| DB push | `pnpm db:push` |
| Regenerate DB types | `pnpm db:types` |

Run `pnpm lint` + `pnpm typecheck` + `pnpm test` before declaring any task complete.

## Frontend design — `minimalist-ui` is MANDATORY

The visual authority for **every view, page, and component** is the installed skill `minimalist-ui` (from Taste Skill). It is installed **project-local only** (not global). Load it **before writing any UI code**:

| Agent | Path (inside this repo) |
|-------|-------------------------|
| Claude Code | `.claude/skills/minimalist-ui/SKILL.md` |
| Codex | `.agents/skills/minimalist-ui/SKILL.md` |
| OpenCode | `.claude/skills/minimalist-ui/SKILL.md` or `.agents/skills/minimalist-ui/SKILL.md` (discovers both) |

Commit these folders to git so the skill travels with the project.

Design language: **Premium Utilitarian Minimalism** — warm monochrome palette, typographic contrast, flat bento grids, muted pastel accents, editorial structure (Notion/Linear feel). Professional and modern, never decorative.

### Absolute bans (from the skill — no exceptions)

- Fonts: no `Inter`, `Roboto`, `Open Sans`.
- No gradients, neon, or glassmorphism (subtle navbar blur only).
- No heavy Tailwind shadows (`shadow-md/lg/xl`); shadows ≤ 0.05 opacity, ultra-diffuse.
- No bright primary-color backgrounds for heroes or large sections.
- No `rounded-full` on cards, large containers, or primary buttons (pills only for small tags/badges).
- No generic thin-line icon libraries as the visual voice (Lucide/Feather/Heroicons): prefer clean custom SVG primitives; if `lucide-react` is unavoidable, style overrides must match the skill's restraint.
- No emojis in UI copy, headings, alt text, or code output.

### Design tokens first

Define color, type, and spacing tokens (CSS variables / Tailwind theme) before building components. Never scatter raw hex values through components. One accent color, used sparingly.

## Views to build (from `docs/PROMTP.md` §39–45)

| Route | Purpose | Key components |
|-------|---------|----------------|
| `/` | Landing: "¿Qué puedo cocinar con lo que tengo?", CTA `Comenzar`, 4-step explanation | hero, visual examples |
| `/dashboard` | Meal-type selector, pantry chips, cuisine filter, `Encontrar recetas`, recommendations | `MealTypeSelector`, `CuisineSelector` |
| `/dashboard/pantry` | Search/add/edit/remove ingredients with quantity + unit | `IngredientSearch`, `IngredientSelector`, `PantryList`, `PantryItem` |
| `/dashboard/recipes` | Filters + recipe cards with match score | `RecipeCard`, `RecipeGrid`, `RecipeMatchScore`, `MissingIngredients` |
| `/dashboard/recipes/[id]` | Full recipe detail + favorite button + source | `RecipeIngredients`, `RecipeInstructions`, `FavoriteButton` |
| `/dashboard/favorites` | Saved recipes, remove favorite | `RecipeCard`, `EmptyState` |

Shared states required everywhere: `LoadingState`, `EmptyState`, `ErrorState` (skeletons only where they add sense).

### Match score UI rule (§72)

Never show an abstract number alone. Always explain it: `"92% de coincidencia"` **or** `"Tienes 5 de 6 ingredientes"`. The user must understand *why* a recipe was recommended.

## Architecture rules

- **Hexagonal layers:** `src/domain` → `src/application` (ports/use cases) → `src/infrastructure` → `src/lib/composition` (DI wiring). Never import across layers inward; never put business logic in components.
- **Data flow:** Server Component → Use Case → Repository → Supabase. **Do not** route through `/api/*` Route Handlers unless the consumer is external (§49).
- **State:** prefer Server Components, URL search params, local React state, React Hook Form + Zod. No Redux/global stores. Client Components only for interaction, browser APIs, and interactive forms (§47–48).
- **shadcn/ui** may be used as a base, but every styled surface must be re-derived through the `minimalist-ui` tokens and bans — out-of-the-box shadcn defaults (Lucide icons, default shadows) are not compliant by themselves.
- Keep types strict; use generated Supabase types from `src/types/database.types.ts` — never hand-write DB row types.

## Quality checklist (every UI task)

- [ ] `minimalist-ui` skill loaded before writing UI code
- [ ] Tokens defined first; no raw hex/scattered values
- [ ] All absolute bans respected
- [ ] Mobile-first, responsive, semantic HTML, visible keyboard focus, `prefers-reduced-motion`
- [ ] Loading / empty / error states present
- [ ] UI copy in Spanish, code/comments in English
- [ ] `pnpm lint && pnpm typecheck && pnpm test` pass

## References

- Master spec: `docs/PROMTP.md`
- Frontend specs: `docs/specs/12-frontend-foundation/`, `13-frontend-dashboard-pantry/`, `14-frontend-recipes-favorites/`
- Design skill: `minimalist-ui` (paths above)
