# ODD — Spec 05: Autenticación con Supabase (clients, sesiones, rutas protegidas)

## Objetivo

Registro, login y logout funcionales con `@supabase/ssr` (browser/server separados), los 4 casos de
uso de auth tras un puerto en la capa application, refresh de sesión con el mecanismo vigente de
Next.js 16 + Supabase, y protección real de `/dashboard` con redirect a `/login`. Ninguna secret key
llega al bundle del navegador.

## Por qué

La ISSUE 05 es la base para que RLS (spec 04) identifique al usuario y para que pantry/favoritos
operen por usuario. Sin esto, los specs 06–11 no tienen consumidor de sesión.

## Alcance autorizado

- **Dentro:** deps `@supabase/supabase-js` + `@supabase/ssr`; puerto `AuthPort`; casos de uso
  `RegisterUser`, `LoginUser`, `LogoutUser`, `GetCurrentUser`; adapter Supabase; clients browser/server;
  wiring en composition root; `src/proxy.ts` (refresh + redirect); páginas `/login`, `/register`,
  `/dashboard` (shell mínimo); unit tests con puerto mockeado; grep de build sin secret key;
  documentación del mecanismo de refresh en `docs/specs/05-supabase-auth/SPEC.md`; criterios de la
  ISSUE marcados.
- **Fuera de alcance:** RLS (03/04), diseño completo (12–14), admin/service-role client (no estrictamente
  necesario para los 4 casos de uso — documentado como decisión), email confirmation config del proyecto,
  E2E Playwright de auth (spec 16).

## Restricciones

- pnpm ONLY. UI copy en español; código/comentarios/commits en inglés.
- Hexagonal: application no importa Supabase; dominio no participa (sin reglas de negocio nuevas).
- `SUPABASE_SECRET_KEY` solo servidor; jamás `NEXT_PUBLIC_*` ni en clientes browser.
- Verificar docs vigentes: Next 16 usa `proxy.ts` (middleware deprecado); Supabase recomienda
  `createBrowserClient`/`createServerClient` + refresh en proxy con `getClaims()`/`getUser()`.
- TDD estricto: NO configurado → checks ordinarios `pnpm lint && pnpm typecheck && pnpm test`.
- RDD: off (clone-local) → sin ceremonia de revisión nativa.
- Rama feature primero si estamos en la default.
- Delegación: el runtime rechazó el sub-agente (`OpenCode free tier`) → ejecución inline; registrado aquí
  como desviación del trigger de writer (10+ archivos no triviales).

## Entrega

- Forecast real autorado: **~1314 líneas** (1349 add + 35 del, `250eb1c..HEAD`) → **>400**;
  estrategia `ask-on-risk`: decisión de chain strategy pendiente ANTES de abrir PR(s).
- Sin PR pedido por el usuario en esta sesión → commits work-unit locales en rama
  `feat/05-supabase-auth`; ninguna entrega remota realizada.

## Tareas

- [x] T1 — Rama feature `feat/05-supabase-auth` (creada desde `feat/04-security-rls`)
- [x] T2 — `pnpm add @supabase/supabase-js @supabase/ssr` (2.117.3 / 0.12.7)
- [x] T3 — Puerto `src/application/ports/auth.ts` (`AuthPort`, `AuthUser`, `AuthResult`, `AuthErrorCode`, `RegisterOutcome`)
- [x] T4 — Casos de uso en `src/application/auth/` (RegisterUser, LoginUser, LogoutUser, GetCurrentUser)
- [x] T5 — Adapter `src/infrastructure/auth/supabase-auth-port.ts` + clients
      `src/infrastructure/supabase/{browser,server}-client.ts`
- [x] T6 — Composition `src/lib/composition/{auth,browser-auth,server-auth}.ts`
- [x] T7 — `src/proxy.ts`: refresh con `getClaims()` + `/dashboard`→`/login?next=…` + authed fuera de `/login|/register`
- [x] T8 — Páginas `/login`, `/register`, `/dashboard` + formularios (minimalist-ui, RHF+Zod, copy español;
      `/dashboard` bajo `<Suspense>` por Cache Components de Next 16)
- [x] T9 — Unit tests `tests/unit/auth-use-cases.test.ts` (15 tests, puerto mockeado, casos 1–5 de la ISSUE)
- [x] T10 — `pnpm lint && pnpm typecheck && pnpm test` → PASS (19/19)
- [x] T11 — `pnpm build` → PASS; grep `.next/static` sin `sb_secret_<valor>` ni `SUPABASE_SECRET_KEY` (caso 6)
- [x] T12 — Redirects verificados contra `next start` (307 con `next`, cookie falsa → 307, assets → 200)
- [x] T13 — SPEC actualizado (refresh, decisión admin, MCP/SDK/Auth) + ISSUE con criterios y registro;
      click-through live queda para spec 16
- [x] T14 — Commits work-unit (4 commits, conventional, sin atribución AI)

## Criterios de aceptación

- [x] 4 casos de uso con tests unitarios (puerto mockeado) → 15/15 PASS
- [x] `/login` y `/register` funcionales y conectadas a los casos de uso (click-through live → spec 16)
- [x] Redirect de `/dashboard` sin sesión → 307 `/login?next=%2Fdashboard`
- [x] Ninguna secret key accesible desde el cliente (grep de build limpio)
- [x] Mecanismo de refresh documentado en SPEC

## Evidencia / progreso

**Commits (work units) en `feat/05-supabase-auth`:**

1. `95aa9e9` feat(auth): add auth port, use cases and Supabase clients — 14 files, +626
2. `a9d62a2` feat(auth): refresh sessions in proxy and protect /dashboard — 3 files, +206
3. `701ab59` feat(auth): add login and register pages wired to use cases — 5 files, +337
4. `1e2ef94` docs(specs): record spec 05 auth implementation evidence — 3 files, +150/−11

**Verificación observada:**
- `pnpm lint` → exit 0 · `pnpm typecheck` → exit 0 · `pnpm test` → 19/19 PASS (3 files)
- `pnpm build` → OK; rutas: `/login` ○, `/register` ○, `/dashboard` ◐ (PPR), `ƒ Proxy (Middleware)`
- `GET :3005/dashboard` sin sesión → `307 /login?next=%2Fdashboard`; `/login`,`/register` → 200 (títulos en español); cookie basura → 307; `/favicon.ico` → 200
- Grep `.next/static`: sin valor `sb_secret_*` ni nombre `SUPABASE_SECRET_KEY` (solo literal librería `startsWith("sb_secret_")`)

**Desviaciones:** delegación de writer no disponible (runtime rechazó el sub-agente: "OpenCode free tier") → ejecución inline.

**Pendiente:** click-through live registro→dashboard→logout contra Supabase real (spec 16 / manual);
decisión de chain strategy (>400 líneas) antes de abrir PR(s).
