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

- Forecast real autorado: **1651 líneas** (1616 add + 35 del, `250eb1c..f8e7d48`) → >400.
- **Decisión del usuario (2026-10-08): NO PR.** Este proyecto no usa PRs: la entrega es
  commitear work units en la rama feature y fusionar directo a `main` (hist lineal → `--ff-only`).
  Anula `ask-on-risk`/chain strategy para este proyecto (guardado en Engram:
  `preferences/delivery-no-prs-merge-main`).
- **Fusionado:** `main` fast-forward `c7977f5` → `f8e7d48` (31 files, +1825/−16), post-merge
  lint/typecheck/23-tests verdes. Incluye 2 commits finales de la spec 04 que aún no estaban
  en main (`250eb1c` RLS policies, `c2e599b` evidencia) — arrastrados como ancestros.
- Sin push a origin (no pedido).

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
- [x] T15 — Comentarios de código de la spec 05 traducidos al español (`c88d40a`);
      preferencia guardada en Engram (`preferences/code-comments-spanish`): de ahora en
      adelante TODOS los comentarios en español en este proyecto
- [x] T16 — E2E live `e2e/auth-flow.spec.ts` (Playwright + Chromium) contra Supabase real;
      2/2 corridas PASS; expuso mensajes crudos en inglés → mapeo a español + 4 unit tests
      (`360f712`), spec E2E (`ffc1b7e`)

## Criterios de aceptación

- [x] 4 casos de uso con tests unitarios (puerto mockeado) → 15/15 PASS
- [x] `/login` y `/register` funcionales y conectadas a los casos de uso
      → E2E live PASS (guard, registro controlado, credenciales, login, logout, rebote)
- [x] Redirect de `/dashboard` sin sesión → 307 `/login?next=%2Fdashboard`
- [x] Ninguna secret key accesible desde el cliente (grep de build limpio)
- [x] Mecanismo de refresh documentado en SPEC
- [x] Comentarios de los archivos nuevos en español (preferencia de proyecto)

## Evidencia / progreso

**Commits (work units) en `feat/05-supabase-auth`:**

1. `95aa9e9` feat(auth): add auth port, use cases and Supabase clients — 14 files, +626
2. `a9d62a2` feat(auth): refresh sessions in proxy and protect /dashboard — 3 files, +206
3. `701ab59` feat(auth): add login and register pages wired to use cases — 5 files, +337
4. `1e2ef94` docs(specs): record spec 05 auth implementation evidence — 3 files, +150/−11
5. `bb91f0a` docs(odd): record spec 05 completion evidence and commits
6. `c88d40a` docs(auth): translate code comments to Spanish — 14 files, +77/−69
7. `360f712` fix(auth): map raw Supabase error messages to Spanish — 2 files, +123/−1
8. `ffc1b7e` test(e2e): add live auth flow spec against Supabase — 1 file, +94

**Verificación observada:**
- `pnpm lint` → exit 0 · `pnpm typecheck` → exit 0 · `pnpm test` → 23/23 PASS (4 files)
- `pnpm build` → OK; rutas: `/login` ○, `/register` ○, `/dashboard` ◐ (PPR), `ƒ Proxy (Middleware)`
- `GET :3005/dashboard` sin sesión → `307 /login?next=%2Fdashboard`; `/login`,`/register` → 200 (títulos en español); cookie basura → 307; `/favicon.ico` → 200
- Grep `.next/static`: sin valor `sb_secret_*` ni nombre `SUPABASE_SECRET_KEY` (solo literal librería `startsWith("sb_secret_")`)
- **E2E live** `pnpm exec playwright test e2e/auth-flow.spec.ts` → 1 test, 2/2 corridas PASS
  (guard → registro controlado en español → guard → credenciales inválidas en español →
  login → dashboard con email visible → logout → guard → re-login → rebote de `/login`)

**Hallazgos del live (corregidos/decididos):**
- Supabase devolvía mensajes crudos en inglés (`email_address_invalid`, rate-limit) filtrados
  a la UI → mapeados a español + fallback español para códigos desconocidos (`360f712`).
- Proyecto real: `mailer_autoconfirm: false` → el registro NO inicia sesión (el aviso
  "Revisa tu email" es el comportamiento correcto; `sessionStarted=false`).
- Validación pública rechaza `example.com`; la cuenta E2E `ff-e2e-auth@example.com` se creó
  confirmada vía admin API (sin email, sin rate-limit). Usuario real de prueba en el proyecto.
- Chromium de Playwright instalado (`pnpm exec playwright install chromium`).

**Desviaciones:** delegación de writer no disponible (runtime rechazó el sub-agente: "OpenCode free tier") → ejecución inline.

**Pendiente:** ninguno de entrega (fusión a `main` hecha, `f8e7d48`). Solo quedan pendientes
del mantenedor: el camino "registro fresco → sesión directa" requiere desactivar
`mailer_autoconfirm` en el proyecto Supabase (cubierto por spec 16 si aplica), y borrar la
cuenta E2E `ff-e2e-auth@example.com` cuando ya no se necesite.
