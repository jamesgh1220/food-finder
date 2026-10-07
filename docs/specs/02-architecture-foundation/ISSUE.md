# ISSUE: 02 — Architecture Foundation

## Título

Definir la arquitectura hexagonal: capas, estructura de carpetas, DI, logging y reglas de independencia del dominio

## Descripción

El prompt exige arquitectura Hexagonal / Ports & Adapters con una regla dura: el dominio no depende de Next.js, React, Supabase ni Spoonacular. Antes de escribir entidades o casos de uso hay que fijar las capas, el árbol de carpetas, la inyección de dependencias explícita, el logging, la regla de mappers y las restricciones de evolución (i18n, PWA/Capacitor, calidad de código).

## Objetivo

Dejar establecida la "caja de huecos" del proyecto: estructura de carpetas canónica, regla de dependencias verificable y mecanismos transversales (DI, logging, mappers), de modo que todas las specs siguientes solo llenen huecos definidos.

## Alcance

- Definición de las 4 capas y su regla de dependencia (#7, #8).
- Estructura de carpetas `src/`, `supabase/`, `tests/`, `docs/` (#9).
- Composition root / DI explícita sin framework (#60).
- Abstracción de logging con niveles y sin secretos (#61).
- Regla obligatoria de mappers para Supabase y Spoonacular (#59).
- Regla de evitar hops innecesarios Server Component → API propia (#49).
- Readiness i18n (#51) y compatibilidad futura PWA/Capacitor (#74).
- Principios de calidad: SOLID, DRY, KISS, tipado estricto (#76).

**Fuera de alcance:** entidades, casos de uso, repositorios concretos; documentación/diagrama (spec 17).

## Casos de prueba

1. Auditoría de imports: ningún archivo de `src/domain/` importa paquetes de Next.js/React/Supabase/Spoonacular.
2. La estructura de carpetas generada coincide con la del SPEC (adaptaciones solo de convención Next.js actual).
3. Un caso de uso se puede instanciar en tests inyectando repositorios mockeados desde el composition root.
4. El logger expone `debug/info/warn/error` y no registra variables sensibles.
5. Ningún Server Component hace `fetch("/api/...")` a rutas propias del proyecto.

## Consideraciones técnicas

- La regla de dominio puro es la más fácil de violar con el tiempo: conviene regla de lint/import boundaries, no solo buena voluntad.
- Mappers son obligatorios en ambas direcciones (DB y externos); son la frontera que protege el dominio.
- No sobrearquitecturar: capas simples, archivos con valor, sin abstracciones sin propósito (#76).

## Criterios de aceptación

- [ ] Estructura de carpetas creada y documentada según REQ-07.
- [ ] Regla REQ-02 verificable y verificada (audit/lint).
- [ ] Composition root único y explícito; cero frameworks de DI.
- [ ] Logger único con niveles y redacción de secretos.
- [ ] Reglas de hops, i18n readiness y PWA/Capacitor escritas en el SPEC y respetadas por el código base.

## Resultado esperado

Un esqueleto hexagonal limpio donde cada capa tiene responsabilidades y límites explícitos, el dominio es independiente de tecnología, y las specs de dominio/aplicación/infraestructura pueden implementarse en paralelo sin rehacer la base.
