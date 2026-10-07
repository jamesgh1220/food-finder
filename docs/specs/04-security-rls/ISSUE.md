# ISSUE: 04 — Row Level Security & Backend Security

## Título

Configurar RLS por tabla y el baseline de seguridad del backend (autorización, validación, secretos, errores)

## Descripción

Con las tablas creadas, el siguiente paso es aislar los datos por usuario con Row Level Security y fijar el baseline de seguridad: autorización respaldada por backend/RLS (nunca solo por la UI), validación Zod de todo input, protección de secretos y manejo seguro de errores. Un fallo aquí expone datos de otros usuarios, por lo que se trata como bloqueante.

## Objetivo

Garantizar que cada usuario solo vea y modifique sus propios datos (perfil, despensa, favoritos), que los catálogos globales sean de solo lectura para usuarios, y que ninguna respuesta exponga secretos ni detalles internos.

## Alcance

- Políticas RLS para `profiles`, `pantry_items`, `favorite_recipes` (usuario propio) y `recipes`, `ingredients`, `cuisines` (solo lectura para autenticados, sin escritura arbitraria).
- Habilitar RLS en **todas** las tablas.
- Autorización a nivel backend/caso de uso.
- Validación Zod de inputs e IDs.
- Protección de secretos y errores seguros.
- Timeouts en llamadas externas.

**Fuera de alcance:** tests E2E de seguridad (spec 16), rate limiting (spec 11), flujos de auth (spec 05).

## Casos de prueba

1. Usuario A no puede leer ni modificar el pantry de usuario B (select/update/delete devuelven 0 filas).
2. Usuario A no puede modificar favoritos de usuario B.
3. Usuario no autenticado no obtiene filas de tablas con RLS de usuario.
4. Usuarios autenticados pueden leer `recipes`/`ingredients`/`cuisines` pero no escribir en ellas.
5. Ninguna respuesta de error incluye stack trace, SQL o valores de `.env`.
6. Una llamada a Spoonacular colgada expira por timeout en lugar de bloquear la request.

## Consideraciones técnicas

- RLS es la última línea de defensa: la autorización de la UI nunca es suficiente (#56).
- Las políticas deben ser testeables con usuarios reales (dos usuarios distintos) — los checks 1–3 son los mínimos.
- Validar IDs y cantidades también en el servidor aunque la UI ya lo valide.

## Criterios de aceptación

- [ ] RLS habilitado en todas las tablas del esquema.
- [ ] Cada tabla tiene la política descrita en el SPEC (REQ-01…REQ-06).
- [ ] Casos de prueba 1–4 verificados contra una base real con dos usuarios.
- [ ] Ningún código devuelve secretos ni stack traces al cliente.
- [ ] Validación Zod presente en todas las entradas de datos del backend.

## Resultado esperado

Aislamiento de datos por usuario garantizado a nivel de base de datos, catálogos globales protegidos de escritura y un backend que nunca filtra secretos ni detalles internos — la seguridad verificada por los tests E2E de la spec 16.
