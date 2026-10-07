# SPEC: 02 — Fundamentos de arquitectura

**Fuente:** PROMTP.md #7 (Arquitectura), #8 (Capas), #9 (Estructura de carpetas), #49 (Evitar hops innecesarios), #51 (Readiness i18n), #59 (Mappers), #60 (DI), #61 (Logging), #74 (Readiness Capacitor/PWA), #76 (Calidad de código).

## Propósito

Establecer el esqueleto hexónico (Ports & Adapters), la estructura de carpetas, la inyección de dependencias, el logging, la regla de mappers y las reglas de calidad que mantienen el dominio independiente de Next.js, React, Supabase y Spoonacular.

## Alcance

### Dentro del alcance
- Definición de capas y la regla de dependencia.
- Estructura canónica de carpetas para `src/`, `supabase/`, `tests/`, `docs/`.
- DI simple y explícita (composition root; sin framework de DI).
- Abstracción de logging (`debug`/`info`/`warn`/`error`) con redacción de secretos.
- Regla obligatoria de mappers (filas de BD y DTOs externos nunca llegan al dominio).
- Regla de llamadas: sin hops innecesarios a la API propia desde Server Components.
- Readiness i18n y restricciones de compatibilidad futura PWA/Capacitor.
- Principios de calidad de código (SOLID, DRY, KISS, tipado estricto).

### Fuera del alcance
- Entidades, casos de uso y repositorios concretos (cada uno tiene su spec).
- Diagrama Mermaid y archivos de documentación (ver `17-documentation-release`).

## Requisitos

| ID | Requisito |
|----|-----------|
| REQ-01 | Capas: `Presentation → Application → Domain → Ports → Infrastructure/Adapters`. |
| REQ-02 | El **dominio no debe importar** Next.js, React, Supabase, Spoonacular, `fetch` ni componentes UI. |
| REQ-03 | Presentation: UI, páginas, componentes, formularios, Route Handlers, validación de entrada, serialización HTTP — sin lógica de negocio compleja. |
| REQ-04 | Application: casos de uso, coordinación, DTOs, puertos, autorización a nivel de caso de uso, orquestación de repositorios y servicios. |
| REQ-05 | Domain: entidades, value objects, reglas de negocio, servicios de dominio, errores de dominio, lógica de matching y recomendaciones. |
| REQ-06 | Infrastructure: Supabase, PostgreSQL, Spoonacular, HTTP, persistencia, autenticación técnica, mappers, clientes externos. |
| REQ-07 | Implementar la estructura de carpetas de PROMTP #9 (`src/app`, `src/components`, `src/domain`, `src/application`, `src/infrastructure`, `src/lib`, `src/types`, `supabase/`, `tests/`, `docs/`), adaptándola solo para convenciones actuales de Next.js preservando la separación de capas. |
| REQ-08 | Inyección de dependencias explícita vía un composition root (o equivalente). Sin framework de DI. Cadena de ejemplo: `SupabaseRecipeRepository` + `SpoonacularRecipeProvider` → `RecipeRecommendationService` → `FindRecipesFromPantry`. |
| REQ-09 | Abstracción de logging con niveles `debug/info/warn/error`. Nunca registrar API keys, contraseñas, tokens, secretos ni datos sensibles. |
| REQ-10 | Los mappers son obligatorios: `SupabaseRow → Mapper → Domain Entity` y `SpoonacularDTO → Mapper → Recipe`. Filas/DTOs crudos nunca cruzan hacia dominio/aplicación. |
| REQ-11 | Un Server Component debe invocar casos de uso directamente (`Server Component → Use Case → Repository → Supabase`), nunca `fetch("/api/...")` hacia sus propios Route Handlers. Los Route Handlers existen para clientes externos/APIs y casos donde realmente sean necesarios. |
| REQ-12 | Readiness i18n: no hardcodear decisiones de dominio que bloqueen español/inglés/portugués/francés más adelante. (i18n completo **no** es requerido en el MVP.) |
| REQ-13 | No instalar Capacitor; mantener la arquitectura compatible con PWA/Capacitor (evitar depender exclusivamente de APIs server-side para funcionalidades que luego deban ejecutarse en móvil). |
| REQ-14 | Calidad de código: SOLID, DRY, KISS, composición, funciones pequeñas, nombres descriptivos, tipado estricto, errores explícitos. La arquitectura hexagonal no debe convertirse en una excusa para crear cientos de archivos sin valor. |

## Dependencias

- `01-project-scaffold` (proyecto, tooling, TS strict).

## Criterios de aceptación

- [ ] El árbol de carpetas coincide con REQ-07; cada archivo vive en exactamente una capa.
- [ ] Una verificación estática (lint, auditoría de imports o review) confirma que ningún archivo del dominio importa paquetes de infraestructura/framework (REQ-02).
- [ ] Un composition root cablea explícitamente los adapters hacia los casos de uso (REQ-08).
- [ ] Existe una única implementación de logger; grep no muestra logging de secretos (REQ-09).
- [ ] Ningún Server Component llama a las rutas propias `/api/*` (REQ-11).
- [ ] No se agregó ningún framework de DI ni tecnología prohibida (#75).

## Verificación

Auditoría de imports/lint de límites de dependencia + review de código contra REQ-02, REQ-08, REQ-10, REQ-11.
