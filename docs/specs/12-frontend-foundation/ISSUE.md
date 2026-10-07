# ISSUE: 12 — Base del frontend

## Título

Definir la base del frontend: landing page, componentes compartidos, UX mobile-first y estrategia de estado

## Descripción

Antes de construir pantallas funcionales hay que fijar el lenguaje visual y las reglas: app de descubrimiento de comida (no panel administrativo), landing en `/` con el mensaje central y CTA, los 15 componentes reutilizables, estándares UX (estados loading/empty/error, accesibilidad) y la estrategia de estado sin Redux, priorizando Server Components.

## Objetivo

Una base de UI coherente y reutilizable: landing que comunica el producto, primitivas de componentes listas para las pantallas, y reglas claras de Server/Client Component para no disparar el JavaScript en el cliente.

## Alcance

- Principios de UX mobile-first/responsive/accesible (#38, #46).
- Landing `/` con mensaje, CTA "Comenzar", ejemplos visuales y 4 pasos (#39).
- 15 componentes compartidos (#45) con shadcn/ui donde aplique.
- Estrategia de estado: Server Components, Server Actions, React state, URL params, RHF; sin Redux (#47, #48).
- Readiness i18n del copy (#51).
- Formularios RHF + Zod con validación visible.

**Fuera de alcance:** pantallas de dashboard/pantry (spec 13), recipes/detail/favorites (spec 14), páginas de auth (spec 05).

## Casos de prueba

1. `/` muestra el titular "¿Qué puedo cocinar con lo que tengo?", CTA y los 4 pasos explicados.
2. Cada componente de la lista del SPEC existe y renderiza con datos de prueba.
3. Estados vacíos y de carga visibles en las vistas que consumen datos.
4. Auditoría `'use client'`: solo formularios/interacción; páginas de datos son Server Components.
5. Viewport móvil sin scroll horizontal; HTML semántico con labels.
6. Validaciones de formulario se muestran visualmente al usuario.

## Consideraciones técnicas

- El tono de la UI es "food discovery", no dashboard administrativo: esto guía todas las specs de pantallas siguientes.
- Los estados vacío/carga/error son obligatorios en toda vista de datos (#46).
- El copy debe poder extraerse a un sistema de i18n más adelante (#51).
- Preferir URL search params para filtros compartibles antes que estado global.

## Criterios de aceptación

- [ ] Landing completa y responsiva en `/`.
- [ ] Los 15 componentes creados bajo `src/components/` (subcarpetas según tipo).
- [ ] Reglas de estado escritas y aplicadas: cero Redux, cero global state innecesario.
- [ ] Cada vista de datos con loading/empty/error.
- [ ] Validación visible con RHF + Zod en los formularios existentes.

## Resultado esperado

Base de frontend lista: landing pública que convierte, biblioteca de componentes compartidos y reglas de rendimiento/estado que las pantallas funcionales (specs 13–14) reutilizarán directamente.
