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

- Forecast autorado: ~1000 líneas (add+del) → **>400**; estrategia `ask-on-risk`: decisión de
  chain strategy pendiente ANTES de abrir PR(s). Commits work-unit locales en rama feature.
- Sin PR pedido por el usuario en esta sesión.

## Tareas

- [ ] T1 — Rama feature `feat/05-supabase-auth` (desde la rama actual si no es la default)
- [ ] T2 — `pnpm add @supabase/supabase-js @supabase/ssr`
- [ ] T3 — Puerto `src/application/ports/auth.ts` (`AuthPort`, `AuthUser`, `AuthResult`, `AuthErrorCode`)
- [ ] T4 — Casos de uso en `src/application/auth/` (RegisterUser, LoginUser, LogoutUser, GetCurrentUser)
- [ ] T5 — Adapter Supabase `src/infrastructure/auth/supabase-auth-port.ts` + clients
      `src/infrastructure/supabase/{browser,server}-client.ts`
- [ ] T6 — Composition `src/lib/composition/auth.ts` (única lugar de wiring adapter→casos de uso)
- [ ] T7 — `src/proxy.ts`: refresh de sesión + `/dashboard`→`/login` (+ authed fuera de `/login|/register`)
- [ ] T8 — Páginas `/login`, `/register`, `/dashboard` + formularios (minimalist-ui, RHF+Zod, copy español)
- [ ] T9 — Unit tests `tests/unit/auth-use-cases.test.ts` (puerto mockeado, casos 1–5 de la ISSUE)
- [ ] T10 — `pnpm lint && pnpm typecheck && pnpm test`
- [ ] T11 — `pnpm build` + grep `.next` sin `sb_secret_` ni `SUPABASE_SECRET_KEY` en cliente (caso 6)
- [ ] T12 — Verificación manual/redirect (curl `/dashboard` sin sesión → `/login`)
- [ ] T13 — Docs: sección de refresh de sesión + decisión admin client + distinción MCP/SDK/Auth en
      `docs/specs/05-supabase-auth/SPEC.md`; criterios ISSUE/SPEC marcados
- [ ] T14 — Commits work-unit (conventional, sin atribución AI)

## Criterios de aceptación

- [ ] 4 casos de uso con tests unitarios (puerto mockeado) → PASS
- [ ] `/login` y `/register` funcionales y conectadas a los casos de uso
- [ ] Redirect de `/dashboard` sin sesión verificado
- [ ] Ninguna secret key accesible desde el cliente (grep de build)
- [ ] Mecanismo de refresh documentado en SPEC

## Evidencia / progreso

(pendiente)
