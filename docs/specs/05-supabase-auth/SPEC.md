# SPEC: 05 — Autenticación con Supabase (clients, sesiones, rutas protegidas)

**Fuente:** PROMTP.md #13 (Casos de uso de auth), #21 (Clients de Supabase), #22 (Supabase Auth), #24 (Distinción SDK vs Auth), #57 (Variables de entorno).

## Propósito

Implementar la autenticación de extremo a extremo: clientes Supabase correctamente separados, los cuatro casos de uso de auth, manejo de sesiones, rutas protegidas y las páginas de login/registro.

## Alcance

### Dentro del alcance
- Clients de browser / server / admin de Supabase vía `@supabase/ssr`.
- Casos de uso de auth: `RegisterUser`, `LoginUser`, `LogoutUser`, `GetCurrentUser`.
- Comportamiento de rutas protegidas (`/dashboard` → redirect a `/login`).
- Páginas `/login` y `/register` (shell de UI; el diseño completo pertenece a las specs de frontend).

### Fuera del alcance
- Políticas RLS (spec 04), detalles de la tabla profiles (spec 03), diseño frontend completo (specs 12–14).

## Requisitos

| ID | Requisito |
|----|-----------|
| REQ-01 | Usar `@supabase/supabase-js` + `@supabase/ssr` con las prácticas actuales recomendadas (verificar docs vigentes — no copiar tutoriales desactualizados). |
| REQ-02 | Separar claramente: **client de browser**, **client de server** y **client admin/servicio** solo cuando sea estrictamente necesario. |
| REQ-03 | `SUPABASE_SECRET_KEY` (o el nombre actual recomendado) existe **solo en servidor**. Nunca `NEXT_PUBLIC_SUPABASE_SECRET_KEY`. Nunca exponer service-role keys al navegador. |
| REQ-04 | Casos de uso: `RegisterUser`, `LoginUser`, `LogoutUser`, `GetCurrentUser` (implementaciones en la capa application que llaman al puerto de auth). |
| REQ-05 | Páginas: `/login` y `/register`. Área protegida: `/dashboard`. El acceso no autenticado a rutas protegidas redirige a `/login`. |
| REQ-06 | Usar el mecanismo actual recomendado para mantener/refrescar sesiones de Supabase en Next.js (verificar docs: middleware/proxy/session handling). |
| REQ-07 | Distinguir los conceptos en código y documentación: Supabase **MCP** (tooling de desarrollo) ≠ Supabase **SDK** (runtime) ≠ Supabase **Auth** (usuarios finales). |

## Dependencias

- `01-project-scaffold`, `03-database-schema` (`profiles`), `02-architecture-foundation` (puertos/DI).

## Criterios de aceptación

- [ ] Registro → autenticado y redirigido a `/dashboard`. *(pendiente: click-through live — ver Verificación)*
- [ ] Login con credenciales válidas → `/dashboard`; logout → sesión limpia y rutas protegidas inaccesibles. *(pendiente: click-through live — ver Verificación)*
- [x] Visitar `/dashboard` sin autenticar redirige a `/login`. *(307 → `/login?next=%2Fdashboard` verificado contra servidor de producción)*
- [x] `GetCurrentUser` devuelve el usuario de sesión en contextos de server. *(unit test con puerto mockeado + uso en `/dashboard` server component)*
- [x] Grep confirma que ninguna secret key está en una variable `NEXT_PUBLIC_*` ni en el bundle del cliente. *(grep sobre `.next`: sin `sb_secret_<valor>` ni `SUPABASE_SECRET_KEY` en `.next/static`)*
- [x] Solo existe un lugar documentado que crea el client admin, protegido por acceso a env solo-servidor. *(Hoy no existe ningún client admin: ninguno de los 4 casos de uso lo necesita. La decisión y el lugar único futuro están documentados abajo.)*

## Implementación (resultado)

### Clients (REQ-01/REQ-02/REQ-03)

| Client | Ubicación | Contexto | Llaves |
|--------|-----------|----------|--------|
| Browser | `src/infrastructure/supabase/browser-client.ts` (`createBrowserClient`) | Client Components (formularios, logout) | `NEXT_PUBLIC_SUPABASE_URL` + `NEXT_PUBLIC_SUPABASE_PUBLISHABLE_KEY` |
| Server | `src/infrastructure/supabase/server-client.ts` (`createServerClient`) | Server Components / Route Handlers | solo publishable (mismas `NEXT_PUBLIC_*`) |
| Admin | **no existe** | — | — |

- **Decisión admin client:** `RegisterUser`, `LoginUser`, `LogoutUser` y `GetCurrentUser` operan con la sesión del usuario vía cookies; no requieren service-role. Si una spec futura lo necesita (p. ej. operaciones administrativas sobre otros usuarios), el ÚNICO lugar autorizado para crearlo es `src/infrastructure/supabase/admin-client.ts`, con `import "server-only"`, `SUPABASE_SECRET_KEY` (solo servidor, jamás `NEXT_PUBLIC_*`) y `auth: { persistSession: false, autoRefreshToken: false, detectSessionInUrl: false }`.
- Ningún módulo de la aplicación referencia `SUPABASE_SECRET_KEY` hoy; grep sobre `.next/static` confirma que el bundle del navegador no contiene el nombre ni el valor de la variable (caso de prueba 6).

### Mecanismo de refresh de sesión (REQ-06)

Documentado según las docs vigentes de Next.js 16.4 y Supabase (verificado contra `node_modules/next/dist/docs/` y las guías actuales de `@supabase/ssr`; sin tutoriales antiguos):

1. **`src/proxy.ts`** — Next.js 16 renombró la convención `middleware.ts` → `proxy.ts` (middleware está deprecado). El proxy corre antes de renderizar cada ruta.
2. Por request: crea un `createServerClient` con cookies de la petición y llama a **`supabase.auth.getClaims()`**, que inicializa la sesión en modo lazy y **refresca tokens expirados**; los cookies nuevos se propagan mediante `setAll` → `Set-Cookie` de la respuesta. Sin este paso, Server Components no pueden escribir cookies y la sesión moriría (patrón oficial de `@supabase/ssr`).
3. El proxy es también el único punto de **redirect de rutas**: sin sesión, `/dashboard*` → `/login?next=…`; con sesión, `/login` y `/register` → `/dashboard`.
4. **`/dashboard`** (Next 16 Cache Components): la lectura de `cookies()` vive dentro de un `<Suspense>`, con chequeo de defensa con `GetCurrentUser` → `redirect("/login")` si no hay sesión.
5. En el navegador, `createBrowserClient` mantiene la sesión proactive-mente actualizada en cookies, sincronizándose con el proxy.

### Casos de uso (REQ-04)

`src/application/auth/{register-user,login-user,logout-user,get-current-user}.ts` — clases que dependen solo del puerto `AuthPort` (`src/application/ports/auth.ts`), con validación de entrada y resultados controlados (`AuthResult<T>`, nunca throw para fallos esperados). Wiring exclusivo en `src/lib/composition/auth.ts` (+ `browser-auth.ts` / `server-auth.ts` para elegir el adapter por contexto). El adapter Supabase vive en `src/infrastructure/auth/supabase-auth-port.ts`.

> Nota: si el proyecto exige confirmación de email, `RegisterUser` devuelve `sessionStarted: false` y la UI muestra el aviso en lugar de redirigir (el criterio "registro → `/dashboard`" asume confirmación desactivada, como en el MVP del PROMTP).

### Conceptos (REQ-07)

- **Supabase MCP**: server MCP de desarrollo (tooling para el agente/editor; p. ej. `supabase` MCP configurado en la sesión). No participa en el runtime de la app.
- **Supabase SDK**: `@supabase/supabase-js` + `@supabase/ssr`, las librerías que el código de la app importa para hablar con la API en runtime.
- **Supabase Auth**: el servicio de usuarios finales (tablas `auth.users`, sesiones, tokens) que los casos de uso consumen a través del puerto.

## Verificación

Tests unitarios de los casos de uso de auth con un puerto de auth mockeado + flujo manual/E2E (registro, login, logout, redirect) cubierto en `16-testing-strategy`.

**Evidencia de esta implementación:**

- `pnpm lint && pnpm typecheck && pnpm test` → PASS (19 tests; 15 de auth con puerto mockeado).
- `pnpm build` → PASS (rutas: `/login` y `/register` estáticas, `/dashboard` con contenido dinámico bajo Suspense, `Proxy (Middleware)` registrado).
- Redirect con servidor de producción: `GET /dashboard` sin sesión → `307 /login?next=%2Fdashboard`; `/login` y `/register` → `200` con copy en español; cookie falsa → `307` (sin 500); `_next/static` y `favicon.ico` → `200`.
- Grep de secrets sobre `.next/static` → sin valores `sb_secret_*` ni el nombre `SUPABASE_SECRET_KEY` (solo literal de librería `startsWith("sb_secret_")`).
- **Pendiente (spec 16 / manual):** click-through live registro → dashboard → logout contra Supabase real.
