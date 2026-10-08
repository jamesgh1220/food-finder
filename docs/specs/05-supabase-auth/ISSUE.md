# ISSUE: 05 — Autenticación con Supabase

## Título

Implementar autenticación con Supabase: clientes separados, casos de uso de auth y rutas protegidas

## Descripción

El MVP necesita registro, inicio y cierre de sesión con sesiones manejadas según las prácticas actuales de Supabase + Next.js. Esto incluye separar correctamente los clientes (browser/server/admin), mantener la secret key solo en servidor, implementar los 4 casos de uso de auth y proteger `/dashboard` con redirect a `/login`.

## Objetivo

Autenticación funcional y segura: usuarios se registran, inician sesión, cierran sesión y las rutas protegidas realmente redirigen a los no autenticados, sin exponer nunca claves al navegador.

## Alcance

- Clients de Supabase con `@supabase/ssr`: browser, server y admin (solo si estrictamente necesario).
- Casos de uso: `RegisterUser`, `LoginUser`, `LogoutUser`, `GetCurrentUser`.
- Páginas `/login` y `/register`.
- Protección de `/dashboard` con redirect a `/login`.
- Manejo/refresh de sesión con el mecanismo recomendado actual.
- Regla de secretos: `SUPABASE_SECRET_KEY` solo servidor.

**Fuera de alcance:** políticas RLS (spec 04), diseño visual completo (specs 12–14), tablas (spec 03).

## Casos de prueba

1. Registro con email/password válido → sesión activa y redirect a `/dashboard`.
2. Login con credenciales correctas → `/dashboard`; con credenciales incorrectas → error controlado.
3. Logout → cookie/sesión eliminada; volver a `/dashboard` redirige a `/login`.
4. Usuario no autenticado visita `/dashboard` → redirect `/login`.
5. `GetCurrentUser` devuelve el usuario en contexto server.
6. El bundle del navegador no contiene la secret key (grep sobre el build).

## Consideraciones técnicas

- Verificar la documentación actual de Supabase para naming de llaves, SSR y session handling; no copiar tutoriales viejos (#94).
- El client admin/service solo para casos que lo exijan, siempre tras una guarda server-only.
- Los casos de uso viven en la capa application, detrás de un puerto de auth (el dominio no conoce Supabase).

## Criterios de aceptación

- [x] Los 4 casos de uso implementados con tests unitarios (puerto mockeado). *(15 tests en `tests/unit/auth-use-cases.test.ts`, todos PASS)*
- [x] Páginas `/login` y `/register` funcionales y conectadas a los casos de uso. *(formularios RHF+Zod → casos de uso → adapter; renderizan con copy en español y manejo de errores controlado. El click-through live contra Supabase queda para spec 16)*
- [x] Redirect de rutas protegidas verificado en el navegador. *(verificado contra el servidor de producción: `GET /dashboard` sin sesión → `307 /login?next=%2Fdashboard`, misma lógica de `src/proxy.ts` que ejecuta el navegador)*
- [x] Ninguna clave secreta accesible desde el cliente. *(grep sobre `.next/static`: sin valor `sb_secret_*` ni nombre `SUPABASE_SECRET_KEY`; solo el literal de librería `startsWith("sb_secret_")`. Ningún módulo referencia `SUPABASE_SECRET_KEY`)*
- [x] Mecanismo de refresh de sesión según docs actuales, documentado en el SPEC/README. *(sección "Mecanismo de refresh de sesión (REQ-06)" en `docs/specs/05-supabase-auth/SPEC.md`: `proxy.ts` de Next 16 + `getClaims()` de `@supabase/ssr`)*

## Registro de implementación

**Estado:** completado con click-through live pendiente (2026-10-08, rama `feat/05-supabase-auth`)

**Qué se hizo:**
- Deps: `@supabase/supabase-js@2.117.3` + `@supabase/ssr@0.12.7`.
- Puerto `AuthPort` (`src/application/ports/auth.ts`) con `AuthResult` controlado y `RegisterOutcome` (distingue cuenta con/sin sesión según confirmación de email).
- Casos de uso: `src/application/auth/{register-user,login-user,logout-user,get-current-user}.ts` (validación de entrada, sin throw).
- Adapter: `src/infrastructure/auth/supabase-auth-port.ts` (mapeo de errores Supabase → códigos controlados con mensajes en español).
- Clients: `src/infrastructure/supabase/browser-client.ts` y `server-client.ts` (solo publishable; sin client admin — decisión documentada en el SPEC).
- Composition: `src/lib/composition/auth.ts` (+ `browser-auth.ts`, `server-auth.ts`) como único punto de wiring.
- `src/proxy.ts`: refresh de sesión con `getClaims()` + redirects (`/dashboard*` → `/login?next=…`, sesión → fuera de `/login|/register`).
- Páginas: `/login`, `/register` (formularios client con RHF+Zod, copy español) y `/dashboard` (server component con `GetCurrentUser` + `redirect`, contenido bajo `<Suspense>` por Cache Components de Next 16).
- Verificación: lint/typecheck/test (19/19) · build OK · redirect HTTP 307 verificado · grep de secrets sobre `.next` limpio.

**Cambios vs plan:** sin desviaciones de alcance; el E2E live (registro → dashboard → logout contra Supabase real) queda para spec 16 tal como indica el SPEC.

**Dependencias:** `01` ✅ · `02` ✅ · `03` ✅ (`profiles`) · siguientes: `06-domain-layer`, `07-application-layer` (el puerto y casos de uso quedan como precedente), `16-testing-strategy` (E2E live).

**Verificación:** `pnpm lint && pnpm typecheck && pnpm test` en verde (19 tests) · `pnpm build` OK (proxy registrado) · `GET /dashboard` → 307 `/login` · grep secrets limpio.

## Resultado esperado

Flujo de autenticación completo y seguro (registro → dashboard → logout), base para que RLS identifique al usuario y para que pantry/favoritos operen por usuario.
