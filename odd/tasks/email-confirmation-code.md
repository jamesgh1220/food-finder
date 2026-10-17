# ODD — Confirmación de cuenta por código de 6 dígitos (cross-device)

Objetivo: que cualquier persona, desde cualquier máquina o dispositivo, pueda confirmar su cuenta y iniciar sesión, sin depender de un dominio público ni de la cookie PKCE del navegador donde se registró.
Rama: `feat/email-confirmation-code` (desde `main`). Estrategia de entrega: `no-pr` (preferencia guardada `preferences/delivery-no-prs-merge-main`: work units en rama feature → fusión directa a `main`). Runner: `pnpm test` (TDD: RED → GREEN → REFACTOR).

Cierra el pendiente explícito de `odd/tasks/05-supabase-auth.md`: *"el camino 'registro fresco → sesión directa' requiere desactivar `mailer_autoconfirm` en el proyecto Supabase"*. Con el código OTP el usuario confirma y obtiene sesión **sin** tocar `mailer_autoconfirm`.

## Specs

- **S1 — Confirmación por código, independiente del origen.** Confirmar la cuenta se hace tipeando un código de 6 dígitos en la app, no abriendo un link. El puerto usa `verifyOtp({ email, token, type: "signup" })`. Ningún paso depende del `code_verifier` local del navegador, así que registrarse en una máquina y confirmar desde otra funciona.
  Evidencia del mecanismo (docs Supabase, *Email Templates*): `{{ .Token }}` — *"Contains a 6-digit One-Time-Password (OTP) that can be used instead of the `{{. ConfirmationURL }}`"*.
- **S2 — El registro lleva a la pantalla de código.** Con `mailer_autoconfirm: false`, `RegisterUser` devuelve `sessionStarted: false`; el formulario redirige a `/confirm?email=<email-registrado>` en lugar de mostrar el aviso actual.
- **S3 — La cuenta sin confirmar tiene camino de salida.** Si el login falla con `email_not_confirmed`, la UI muestra el mensaje vigente ("Confirma tu email antes de iniciar sesión. Revisa tu bandeja de entrada.") **y** un enlace a `/confirm?email=<email>`. Hoy esa pantalla es un callejón sin salida.
- **S4 — Código inválido o expirado → error controlado.** Los fallos de `verifyOtp` (`otp_expired`, 403 *"token has expired or is invalid"*) se mapean al código de puerto `invalid_token` con mensaje en español. Nunca se filtra el mensaje crudo en inglés.
- **S5 — Reenviar código.** Desde `/confirm` se puede pedir un código nuevo (`resend({ type: "signup", email })`). Sin esto, un código perdido o expirado deja la cuenta inaccesible: viola el objetivo.
- **S6 — Sin regresión.** `RegisterUser`, `LoginUser`, `LogoutUser` y `GetCurrentUser` conservan su comportamiento observable. El mensaje de `email_not_confirmed` no cambia; solo cambia su **código** (de `unknown` a `email_not_confirmed`) para que la UI pueda ofrecer el enlace.
- **S7 — Hexagonal intacta.** La capa `application` sigue sin importar `@supabase/*`, Next.js ni React. Los casos de uso nuevos se suman a `AuthServices`; `ApplicationServices` los hereda.
- **S8 — Fuera del repo (paso manual del mantenedor).** La plantilla **Confirm sign up** del dashboard debe incluir `{{ .Token }}`. El código generado no depende de la plantilla, pero el mail no lo muestra hasta que se agregue. No es automatizable por el agente.
  **Bloqueado (2026-10-17):** la edición de plantillas exige un SMTP propio y el usuario no tiene dominio. El paso queda delegado en `odd/tasks/gmail-smtp-email-delivery.md` (S3).

Fuera de alcance: el flujo de *magic link* con `token_hash` + ruta `/auth/confirm` (opción B, descartada por el usuario), el deploy en Vercel y el SMTP propio de producción.

## Tasks

- [x] **T1** — RED de puerto y casos de uso: `ConfirmRegistration` / `ResendConfirmation` (validación + delegación). (S1,S4,S5)
  RED observado: `Failed to resolve import "@/application/auth/confirm-registration"` con los 346 tests previos en verde.
- [x] **T2** — Puerto `AuthPort`: códigos `email_not_confirmed` e `invalid_token`, `ConfirmRegistrationInput`, métodos `confirmRegistration` / `resendConfirmation`; casos de uso nuevos; `email-validation.ts` compartido; wiring en `createAuthServices`. (S1,S5,S7)
- [x] **T3** — Adapter Supabase: `verifyOtp({email,token,type:"signup"})` + `resend({type:"signup",email})` + mapeo de `otp_expired` → `invalid_token`. Firmas verificadas contra los typings instalados (`auth-js@2.117.3`: `VerifyEmailOtpParams`, `ResendParams`). (S1,S4)
- [x] **T4** — UI: `/confirm` (◐ PPR, `searchParams` dentro de `<Suspense>`) + `ConfirmRegistrationForm` (código + reenvío), redirección desde `/register`, enlace desde `/login` y `/confirm` agregado a `AUTH_PAGES` en `proxy.ts`. (S2,S3,S5)
- [x] **T5** — Fakes y aserciones actualizados: `auth-use-cases.test.ts` (+19 tests), `application/helpers.ts`, `application/composition.test.ts` (21→23 servicios, "4 auth"→"6 auth"), `supabase-auth-port.test.ts` (fake `verifyOtp`/`resend` + 4 tests nuevos) y el E2E live `e2e/auth-flow.spec.ts`. (S6)
- [x] **T6** — Docs: `docs/specs/05-supabase-auth/SPEC.md` (REQ-04, REQ-05, REQ-08 nueva, verificación) + este documento. (S8)
- [x] **T7** — Verificación: `pnpm lint && pnpm typecheck && pnpm test` → PASS · `pnpm build` → PASS (riesgo alto: auth).
- [x] **T8** — `odd/tasks/05-supabase-auth.md`: el pendiente de `mailer_autoconfirm` queda cerrado, con el paso manual de la plantilla como pendiente nuevo.
- [x] **T9** — Advisory 1 del verificador: `ConfirmRegistrationForm` envuelve el reenvío en `try/catch/finally` para que una excepción no-`AuthError` no deje el botón trabado; regresión en `tests/unit/components/confirm-registration-form.test.tsx`. (S5)

**Verificación observada (2026-10-17):**

- `pnpm lint` → exit 0 · `pnpm typecheck` → exit 0
- `pnpm test` → **376/376 PASS** (53 files). Baseline previa: 346 tests. Neto +30 (19 del feature + 4 del advisory 1 + 7 de fakes/aserciones actualizadas).
- `pnpm build` → PASS. `/confirm` → `◐` (Partial Prerender); `/login` y `/register` → `○` (estáticas); `Proxy (Middleware)` registrado.
- Estrategia RED→GREEN respetada: los tests de casos de uso se escribieron primero y fallaron por módulo inexistente antes de implementar. El advisory 1 se verificó por **mutación**: revertido el fix, el test correspondiente falla; restaurado, vuelve a verde.
- **No ejecutado:** `pnpm test:e2e` (Playwright live). El camino feliz de `verifyOtp` requiere un código real de un buzón real, y el proyecto apunta a Supabase real. El spec quedó actualizado para la nueva salida (redirect a `/confirm`).

## Log

**L1 (2026-10-17, verbatim):** "Necesito que me digas por que cuando creo una cuenta desde la aplicacion el desarrollo, supabase envia un correo con un link para activar la cuenta pero ese link esta apuntando a localhost:3000, necesito corregir eso, necesitaria primero un dominio real para solucionarlo ?"

**L2 (2026-10-17, verbatim):** "yo quiero que cualquier persona desde cualquier maquina pueda confirmar su cuenta y poder iniciar sesion, que opciones hay con esa forma?"

**L3 (2026-10-17, verbatim):** "Mi idea es desplegarlo en vercel free para que pueda acceder la gente en produccion, aun asi sigue siendo A tu recomendacion por ahora ? si es asi, adelante"

**Análisis (2026-10-17) — por qué A (OTP) y no B (link + `/auth/confirm`).**
- El link actual está roto **por dos causas independientes**: el host sale del *Site URL* del proyecto (default `http://localhost:3000`) y `register()` no pasa `emailRedirectTo` (`supabase-auth-port.ts:70`). Además `NEXT_PUBLIC_APP_URL` existe en `.env`/`.env.example` pero no se usa en ningún lado: es config muerta.
- Aun arreglando el host, el **flujo PKCE ata el link al navegador**: docs *PKCE flow* → Limitations — *"The code verifier is created and stored locally when the Auth flow is first initiated. That means the code exchange must [occur in the same browser]"*. Registrarse en desktop y abrir el mail en el celular falla el intercambio. Es el fallo real detrás del pedido de L2.
- La opción B (`{{ .TokenHash }}` + ruta server) sí resuelve el cross-device, pero sigue exigiendo un host público y agrega la configuración de *Redirect URLs*.
- A no necesita URL, ni allowlist, ni PKCE: es idéntico en dev y en prod. Con Vercel (L3) importa además que el OTP **no depende de la URL del deployment**, así que los preview deployments no rompen nada.
- **L3 confirma A:** la condición "si es asi, adelante" se cumple; el deploy en Vercel es el paso siguiente, no un motivo para cambiar de opción.

**Hallazgos del mapeo previo.**
- No existe ninguna ruta de callback: grep de `verifyOtp|token_hash|exchangeCodeForSession` en `src/` → 0 resultados.
- Dos fakes con `satisfies AuthPort` (`tests/unit/auth-use-cases.test.ts:24`, `tests/unit/application/helpers.ts:31`) se rompen al extender el puerto: hay que actualizarlos.
- `tests/unit/application/composition.test.ts` asserta `Object.keys(services).sort()` contra `EXPECTED_SERVICE_KEYS` y el nombre del test dice "wires all 21 use cases (4 auth + 17 new)": se actualiza a 23 (5 auth + 17 new) + los 2 casos de uso nuevos.
- `src/application/index.ts` **no** reexporta `./auth/*` (comentario explícito): no hay que tocarlo.
- `mapAuthError` ya mapea `email_not_confirmed`, `over_email_send_rate_limit` y `rate_limit_exceeded`; el test `supabase-auth-port.test.ts:67` solo asserta el **mensaje**, no el código, así que el cambio de código no lo rompe.

**Riesgo declarado.** Autenticación: un error en la confirmación puede dejar cuentas inaccesibles o saltarse la verificación de email. Acotado: la verificación la sigue haciendo Supabase (`verifyOtp` con el token que él generó); la app no decide quién está confirmado. El cambio de código de error de `email_not_confirmed` es aditivo sobre una unión de tipos y no altera el mensaje.

**Presupuesto de entrega.** Pronóstico ~500 líneas autoradas (fuente + tests + docs). Supera el umbral de ~400, umbral que **no dispara encadenado en este proyecto**: la preferencia guardada `preferences/delivery-no-prs-merge-main` anula `ask-on-risk`/chain strategy (este repo no usa PRs).

**Desviaciones registradas.**
- Comentarios de código en **español** (preferencia de proyecto `preferences/code-comments-spanish`, confirmada por el código vecino). `AGENTS.md` dice lo contrario ("comments … in English") y está desincronizado con el repo; se sigue la convención real del código.
- Commit messages en inglés, sin atribución AI (`AGENTS.md` + regla de persona).

**Verificación (2026-10-17).**
- Compuerta: `pnpm lint` 0 · `pnpm typecheck` 0 · `pnpm test` **376/376** (53 archivos; 346 previos + 19 del feature + 1 del advisory 1) · `pnpm build` PASS con `/confirm` ◐ (Partial Prerender), `/login` ○, `/register` ○.
- Verificador independiente (no escribió el código): **S1–S7 covered, S8 partial, 0 blockers**, 2 advisories.
  - Confirmó que `pnpm typecheck` cubre `tests/` de verdad (inyectó un `TS2322` positivo control y lo detectó).
  - Confirmó que el mensaje `email_not_confirmed` es **byte-idéntico** al baseline (`cmp` contra `git show 161efa0:…`), así que `T1` no altera output existente.
- **Advisory 1 cerrado** (`15a3570`): auth-js solo captura `AuthError` y re-lanza el resto, así que una excepción inesperada (p. ej. `NEXT_PUBLIC_SUPABASE_URL` ausente en un deploy nuevo) dejaba el botón de reenvío trabado en "Enviando…". Fix: `try/catch/finally` en `ConfirmRegistrationForm` + mensaje "No se pudo reenviar el código. Inténtalo de nuevo.". Regresión en `tests/unit/components/confirm-registration-form.test.tsx` (4 tests). **RED verificado con mutación**: revertido el fix, el test 1 falla; restaurado, 376/376.
- **Advisory 2 confirmado como fuera de alcance** (decisión registrada en L-negociación): registrar una cuenta ya existente/confirmada cae en `/confirm` con un código que nunca llega. Supabase oscurece esto deliberadamente para evitar enumeración; las salidas existentes (link "Iniciar sesión", "Reenviar código") ya estaban. El baseline era igual de engañoso.
- **E2E no ejecutado** (`pnpm test:e2e`): es una suite Playwright en vivo contra el proyecto real (`vhjxhqaowxonmtgusskt`) y necesita un buzón real para recibir el código de 6 dígitos. Pendiente de prueba manual.
- **Paso manual del usuario:** agregar `{{ .Token }}` a la plantilla de email **Confirm sign up** en el dashboard de Supabase. Sin eso el código se genera pero nunca se muestra en el correo.

**L4 (2026-10-17, verbatim):** "No tengo dominio y no pienso comprar uno, esta app es solo para pruebas, que se puede hacer? O en su defecto, devolvemos el cambio del codigo OTP y yo me encargo de crear los usuarios desde el dashboard de supabase"

**L5 (2026-10-17, verbatim):** "ya desactive el confirm email desde supabase, con la opcion B crea unicamente el odd, para abordarlo luego pero tener ahi la documentacion"

**Resolución (2026-10-17) — S8 bloqueado, feature cerrada igual.**
- El bloqueo es de **infraestructura, no de código**: editar plantillas exige SMTP propio, y Resend y Brevo exigen dominio verificado (chequeado en sus docs). El usuario no tiene ni va a comprar dominio.
- **Se aplicó la Opción A**: el usuario apagó *Confirm email* en Supabase → el registro va directo a sesión, sin correo. `register-form.tsx:33-42` ya manejaba esa rama; la feature queda operativa en ese estado.
- **El revert del OTP fue descartado**: la Opción A logra lo mismo sin destruir 5 commits y 376 tests verdes. El código queda dormido (solo se activa con `sessionStarted: false`).
- **La Opción B queda documentada** en `odd/tasks/gmail-smtp-email-delivery.md` para abordarla después: Gmail SMTP con App Password, sin dominio.
- **Estado de la rama:** todo fusionado a `main` (`fd23a12`). La feature está cerrada; S8 queda delegado, no resuelto.
