# ODD — Typography System

## Objective
Define and implement the typographic system for Food Finder: which font families
the app uses for display/headings, body/UI/buttons, narrative prose, and
meta/numerals — grounded in how comparable recipe/food products typeset.

## Problem
The app currently loads `Geist` (sans), `Geist_Mono`, and `Newsreader` (serif)
via `next/font/google`, but headings use a *reading* serif (`Newsreader`) that
was never designed for display sizes, and the body sans (`Geist`) is a
developer/tech grotesque that reads cold for a warm food product.

## Why
The user asked to research the typography of comparable apps, compare title /
body / button font choices, decide what to add, and implement it.

## Scope
- In: font-family tokens (`globals.css` `@theme`), font loading (`layout.tsx`),
  and applying the display face to existing headings (login, register, dashboard
  wordmark + H1).
- Out: redesigning the landing placeholder (`src/app/page.tsx` is still the
  Next.js scaffold — separate debt), building new views, color changes.

## Constraints
- `minimalist-ui` skill is the visual authority; keep the 2–3 family discipline.
- Google Fonts only via `next/font/google` (self-hosted, no external network at
  runtime). No paid foundry fonts (Lyon, GT Sectra) unless self-hosted locally.
- UI copy stays Spanish; code/comments English.
- `pnpm` only.

## Research evidence (comparable products)
| Product | Display / Headings | Body / UI | Notes |
|---|---|---|---|
| NYT Cooking | NYT Karnak (custom slab serif) | NYT Franklin (sans) | slab serif in wordmark + recipe titles |
| Tasty (BuzzFeed) | Gelica (serif), HWT Artz (display) | Proxima Nova | serif headlines + neutral sans body |
| Tasty-cooking PWA | Windsor Bold (serif) | GT Flexa (sans) | "classic serif with personality + modern sans" |
| Mise (recipe DS) | GT Sectra (display serif) | Inter (UI) + Source Serif 4 (body serif) | 4 roles incl. JetBrains Mono for timers |
| Food/editorial guidance | Playfair Display / Fraunces family | Lato / Open Sans / DM Sans | serif personality for titles, legible sans for instructions & ingredient numbers |

Conclusion: recipe products converge on a **soft/slab serif with personality for
display + a highly legible sans for body/instructions**, keeping numerals and
fractions unambiguous.

## Decision
Add **two** Google Fonts and keep the two that still have a job:

| Role | Family | Token | Change |
|---|---|---|---|
| Display / headings / wordmark | **Fraunces** (soft serif w/ optical + SOFT/WONK axes) | `--font-display`, `--font-heading` | NEW |
| Body / UI / buttons / instructions | **Plus Jakarta Sans** | `--font-sans` | NEW (supersedes Geist Sans) |
| Narrative / editorial reading | Newsreader | `--font-serif` | KEEP |
| Meta / numerals / timers | Geist Mono | `--font-mono` | KEEP |

Tradeoff: replacing Geist Sans changes every body surface at once (intended —
it is the point of the task); Fraunces adds an optical-size axis to the bundle,
acceptable for a heading face used sparingly.

## Tasks
- [x] T1 — Load `Fraunces` + `Plus_Jakarta_Sans` in `layout.tsx`; drop `Geist`.
- [x] T2 — Update `@theme` font tokens in `globals.css` (sans, display, heading, serif, mono).
- [x] T3 — Apply `font-display` to headings/wordmark in dashboard, login, register.
- [x] T4 — `pnpm lint && pnpm typecheck && pnpm test && pnpm build` pass.

## Acceptance criteria
- Headings render in Fraunces; body/UI render in Plus Jakarta Sans; no `Inter`
  / `Roboto` / `Open Sans`; no regression in existing tests or build.

## Route declaration
- T1–T3: direct inline (already-understood, mechanical token edits across 5
  known files — below the 2+ non-trivial-files writer trigger for research).
- T4: direct (bounded command execution).

## Progress
- [x] Done — evidence: `pnpm lint` clean, `pnpm typecheck` clean,
  `pnpm test` 48/48 passed, `pnpm build` compiled (Fraunces axes accepted).

## Next step
None. Follow-up debt (out of scope): `src/app/page.tsx` is still the Next.js
scaffold and does not use the app typographic tokens beyond inheriting them.
