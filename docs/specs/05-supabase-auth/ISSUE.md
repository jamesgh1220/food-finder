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

- [ ] Los 4 casos de uso implementados con tests unitarios (puerto mockeado).
- [ ] Páginas `/login` y `/register` funcionales y conectadas a los casos de uso.
- [ ] Redirect de rutas protegidas verificado en el navegador.
- [ ] Ninguna clave secreta accesible desde el cliente.
- [ ] Mecanismo de refresh de sesión según docs actuales, documentado en el SPEC/README.

## Resultado esperado

Flujo de autenticación completo y seguro (registro → dashboard → logout), base para que RLS identifique al usuario y para que pantry/favoritos operen por usuario.
