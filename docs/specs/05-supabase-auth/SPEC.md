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

- [ ] Registro → autenticado y redirigido a `/dashboard`.
- [ ] Login con credenciales válidas → `/dashboard`; logout → sesión limpia y rutas protegidas inaccesibles.
- [ ] Visitar `/dashboard` sin autenticar redirige a `/login`.
- [ ] `GetCurrentUser` devuelve el usuario de sesión en contextos de server.
- [ ] Grep confirma que ninguna secret key está en una variable `NEXT_PUBLIC_*` ni en el bundle del cliente.
- [ ] Solo existe un lugar documentado que crea el client admin, protegido por acceso a env solo-servidor.

## Verificación

Tests unitarios de los casos de uso de auth con un puerto de auth mockeado + flujo manual/E2E (registro, login, logout, redirect) cubierto en `16-testing-strategy`.
