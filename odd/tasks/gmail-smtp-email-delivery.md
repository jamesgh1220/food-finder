# ODD — Entrega de email por SMTP de Gmail (sin dominio propio)

Objetivo: que el flujo OTP de confirmación (`email-confirmation-code`) se pueda **probar de punta a punta** sin comprar un dominio, usando una App Password de Google como servidor SMTP.
Estado: **documentación pendiente, no implementado.** No hay cambios de fuente previstos: es configuración de Supabase + Google y verificación manual.
Runner: `pnpm test` (unit) · `pnpm test:e2e` (live, pendiente desde la feature anterior).

**Contexto inmediato.** El usuario desactivó *"Confirm email"* en Supabase (Opción A) para poder usar la app. Este documento deja especificada la **Opción B**, a abordar después: reactivar la confirmación, conectar Gmail SMTP y editar la plantilla **Confirm sign up** con `{{ .Token }}`.

## Specs

- **S1 — Sin dominio propio, sin verificación DNS.** La entrega no puede exigir compra ni verificación de dominio. Cita del usuario: *"No tengo dominio y no pienso comprar uno, esta app es solo para pruebas"*.
  Por eso el proveedor es **Gmail SMTP** (`smtp.gmail.com`), cuya autenticación es por **App Password**, no por DNS. **Resend y Brevo quedan descartados: ambos exigen dominio verificado** (verificado en sus documentaciones el 2026-10-17).
- **S2 — La confirmación de email se reactiva.** La Opción A apagó el toggle en **Authentication → Providers → Email**. La Opción B la reenciende; sin eso no se envía ningún correo y `/confirm` nunca se ejecuta. Hoy ese toggle está **apagado**.
- **S3 — Plantilla "Confirm sign up" con `{{ .Token }}`.** Es el paso S8 de `odd/tasks/email-confirmation-code.md`, hasta ahora bloqueado porque *"Configura un servidor SMTP personalizado para editar las plantillas"*. Con SMTP propio la edición se desbloquea.
  Subject: `Tu código de verificación de Food Finder`.
  Body: el HTML que incluye `<p style="font-size: 32px; font-weight: bold; letter-spacing: 8px;">{{ .Token }}</p>` y **sin** `{{ .ConfirmationURL }}` (ese link apunta a `localhost:3000` y es lo que originó el problema inicial).
- **S4 — Prueba real de punta a punta.** Registrar una cuenta con un email real → recibir el código de 6 dígitos → tipearlo en `/confirm` → caer en `/dashboard`. Este es el criterio que hoy no se puede comprobar.
- **S5 — Sin cambios de fuente.** El código ya cubre ambos caminos: `register-form.tsx:33-42` envía `sessionStarted: true` a `/dashboard` y `false` a `/confirm`. Se espera configuración y verificación, **no** refactor. Si aparece una necesidad de código, es un hallazgo nuevo y se agrega su spec.
- **S6 — E2E en vivo pendiente.** `pnpm test:e2e` quedó sin ejecutar en la feature anterior porque requería un buzón real. Con S4 resuelto pasa a ser ejecutable.

Fuera de alcance: comprar un dominio (decisión explícita del usuario), Resend/Brevo, producción con volumen real, y revertir el código OTP.

## Tasks

- [ ] **T1** — Reactivar *Confirm email*: **Authentication → Providers → Email**. Bloqueante de todo lo demás. (S2)
- [ ] **T2** — Google Account → Security → activar **2-Step Verification** → generar **App Password** de 16 dígitos. (S1)
- [ ] **T3** — **Authentication → Email → SMTP Settings**: Host `smtp.gmail.com`, puerto `465`, Username = la cuenta Gmail, Password = la App Password, Sender email = la misma cuenta Gmail, Sender name `Food Finder`. **Save**. (S1)
- [ ] **T4** — **Authentication → Email Templates → Confirm sign up**: reemplazar Subject y Body según S3. **Save**. (S3)
- [ ] **T5** — Prueba manual de punta a punta según S4. (S4)
- [ ] **T6** — Ejecutar `pnpm test:e2e` (live Playwright). (S6)
- [ ] **T7** — Cerrar este documento y actualizar S8 en `odd/tasks/email-confirmation-code.md` + `docs/specs/05-supabase-auth/SPEC.md` con el estado real de la plantilla. (S3)

**Riesgo declarado.** Autenticación / entrega de email: (2) seguridad y (5) entrega. Aceptado y acotado por ser una app de pruebas. Restricciones conocidas de Gmail: Google revoca las App Password al cambiar la contraseña de la cuenta; Google desaconseja explícitamente los app passwords (*"aren't recommended and are unnecessary in most cases"*); límite del orden de 500 correos/día en cuentas consumidor. El Sender debe ser la misma cuenta Gmail autenticada, o Gmail rechaza el envío.

**Presupuesto de entrega.** 0 líneas autoradas previstas (sin cambios de fuente). T6 es la única ejecución de suite larga.

## Log

**L1 (2026-10-17, verbatim):** "ya desactive el confirm email desde supabase, con la opcion B crea unicamente el odd, para abordarlo luego pero tener ahi la documentacion"

**L2 (2026-10-17, verbatim):** "No tengo dominio y no pienso comprar uno, esta app es solo para pruebas, que se puede hacer? O en su defecto, devolvemos el cambio del codigo OTP y yo me encargo de crear los usuarios desde el dashboard de supabase"

**Decisión (2026-10-17) — Opción A aplicada, Opción B diferida; no se revierte el código.**
- La **Opción A** (apagar *Confirm email*) ya está aplicada por el usuario. Es la vía más corta para una app de pruebas: no se envía ningún correo, el registro va directo a sesión, cero configuración.
- La **Opción B** queda documentada acá para después.
- La **Opción "revertir el OTP" fue descartada**: hace lo mismo que A (ninguna confirmación por email) pero cuesta revertir 5 commits y una feature con 376 tests verdes y verificación independiente. Además crear usuarios a mano desde el dashboard ni siquiera permite probar el flujo de registro de la app. Revertir una implementación correcta por una restricción de *infraestructura* confunde el plano de código con el de entrega.

**Hallazgos de la investigación (2026-10-17, fuentes primarias).**
- El SMTP por defecto de Supabase **solo entrega a miembros del equipo** (*"Supabase Auth will refuse to deliver messages to addresses that are not part of the project's team"* → error *"Email address not authorized"*), a **2 correos/hora**, sin SLA y *"not meant for production use"*. O sea que el requisito original — cualquier persona, desde cualquier máquina — ya era imposible sin SMTP propio. No era un extra de producción: era el bloqueo real.
- La edición de plantillas está tras el SMTP propio: *"Configura un servidor SMTP personalizado para editar el asunto y el cuerpo de los mensajes."* (mensaje del dashboard del usuario).
- **Resend descartado**: requiere dominio verificado (*"If you don't own a domain, please purchase one…"*).
- **Brevo descartado**: también pide autenticar el dominio antes de empezar.
- **Gmail es la única vía sin dominio verificada**: `smtp.gmail.com`, puerto 465, usuario Gmail, contraseña = App Password de 16 dígitos, que exige 2-Step Verification.
- Ruta actual del SMTP en el dashboard: **Authentication → Notifications → Email → SMTP Settings**. Ruta de la plantilla: **Authentication → Email Templates**. Ruta del toggle: **Authentication → Providers → Email**.
- Con SMTP propio el límite pasa a **30 correos/hora**, ajustable en **Authentication → Rate Limits**.
- `{{ .Token }}` es un OTP de 6 dígitos y `mailer_otp_length` ya tiene default `6`, coherente con el código: no hay que tocarlo.
- Alternativa descartada por complejidad para una app de pruebas: **Send Email Auth Hook** (Edge Function) como reemplazo de SMTP.
