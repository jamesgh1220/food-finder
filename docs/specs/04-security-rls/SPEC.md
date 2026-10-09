# SPEC: 04 — Row Level Security y seguridad del backend

**Fuente:** PROMTP.md #20 (Row Level Security), #56 (Seguridad), #57 (Variables de entorno — cumplimiento), #67 (E2E de seguridad — verificación a cargo de `16-testing-strategy`).

## Propósito

Hacer efectivo el aislamiento de datos y la línea base de seguridad del MVP: políticas RLS por tabla, autorización server-side, validación de inputs, protección de secretos, manejo seguro de errores y timeouts externos.

## Alcance

### Dentro del alcance
- Políticas RLS para cada tabla de usuario y de catálogo global.
- Cumplimiento de la checklist de seguridad en toda la app (auth, Zod, IDs, secretos, errores, rate limiting cruzado, timeouts).

### Fuera del alcance
- Tests E2E de seguridad (a cargo de `16-testing-strategy`).
- Implementación de rate limiting (a cargo de `11-api-layer`).
- Flujos de auth/clients (a cargo de `05-supabase-auth`).

## Requisitos

| ID | Requisito |
|----|-----------|
| REQ-01 | `profiles`: el usuario solo puede consultar/modificar **su propio** perfil. |
| REQ-02 | `pantry_items`: el usuario solo puede seleccionar/insertar/actualizar/borrar **sus propias** filas — nunca las de otro usuario. |
| REQ-03 | `favorite_recipes`: el usuario solo administra sus propios favoritos. |
| REQ-04 | `recipes`: las recetas públicas/internas pueden leerse estando autenticado; ningún usuario puede modificar el catálogo global. |
| REQ-05 | `ingredients`: legibles por usuarios autenticados; sin escrituras arbitrarias. |
| REQ-06 | `cuisines`: legibles; sin modificaciones arbitrarias desde el frontend. |
| REQ-07 | RLS habilitado en **todas** las tablas con políticas coherentes con REQ-01…REQ-06 (ninguna tabla sin protección). |
| REQ-08 | Supabase Auth + RLS + autorización a nivel de aplicación presentes; la autorización debe estar respaldada por backend/RLS, **nunca solo por la UI**. |
| REQ-09 | Validación con Zod de todos los inputs: query params, body, route params, IDs, filtros, cantidades, unidades. Nunca confiar directamente en el input del cliente. |
| REQ-10 | Nunca enviar secretos al cliente. `SUPABASE_SECRET_KEY` y `GEMINI_API_KEY` solo en servidor (reforzado por el naming de env de la spec 01). |
| REQ-11 | Manejo seguro de errores: nunca exponer stack traces, API keys, secretos, detalles internos, SQL ni información sensible a los clientes. |
| REQ-12 | Timeouts en llamadas externas (Gemini) para que un proveedor colgado no cuelgue las requests. |

## Dependencias

- `03-database-schema` (las tablas deben existir antes que las políticas).
- `05-supabase-auth` (la identidad de usuario de sesión que usan las políticas) — puede desarrollarse en paralelo y verificarse en conjunto.

## Criterios de aceptación

- [ ] Cada tabla del esquema tiene RLS habilitado con al menos una política por REQ-01…REQ-06.
- [ ] Consultar como usuario A devuelve cero filas del usuario B en `pantry_items` y `favorite_recipes`.
- [ ] Las solicitudes no autenticadas sobre catálogos globales se rechazan según el diseño de políticas.
- [ ] Ningún cuerpo de respuesta de API contiene stack traces, strings SQL ni secretos (revisar rutas de error).
- [ ] Todas las llamadas externas tienen timeouts finitos.

## Verificación

Verificaciones SQL/RLS por tabla + tests de integración/seguridad diferidos a `16-testing-strategy` (los casos S1–S5 de allí reflejan REQ-01…REQ-06).
