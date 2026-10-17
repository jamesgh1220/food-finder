"use client";

import { zodResolver } from "@hookform/resolvers/zod";
import { useRouter } from "next/navigation";
import { useState } from "react";
import { useForm } from "react-hook-form";
import type { ConfirmRegistrationValues } from "@/components/auth/auth-schemas";
import { confirmRegistrationSchema } from "@/components/auth/auth-schemas";
import { createBrowserAuthServices } from "@/lib/composition/browser-auth";

/**
 * Formulario de confirmación por código (spec 05).
 *
 * El código es el `{{ .Token }}` del email. Verificarlo no depende de cookies
 * ni del navegador donde se registró, así que se puede confirmar desde otra
 * máquina o desde el celular leyendo el correo.
 */
export function ConfirmRegistrationForm({
  defaultEmail,
}: {
  defaultEmail: string;
}) {
  const router = useRouter();
  const [formError, setFormError] = useState<string | null>(null);
  const [notice, setNotice] = useState<string | null>(null);
  const [isResending, setIsResending] = useState(false);
  const {
    register,
    handleSubmit,
    getValues,
    trigger,
    formState: { errors, isSubmitting },
  } = useForm<ConfirmRegistrationValues>({
    resolver: zodResolver(confirmRegistrationSchema),
    defaultValues: { email: defaultEmail, token: "" },
  });

  async function onSubmit(values: ConfirmRegistrationValues) {
    setFormError(null);
    setNotice(null);
    const { confirmRegistration } = createBrowserAuthServices();
    const result = await confirmRegistration.execute(values);

    if (!result.ok) {
      setFormError(result.message);
      return;
    }

    router.push("/dashboard");
    router.refresh();
  }

  async function onResend() {
    setFormError(null);
    setNotice(null);

    // Se valida el email con el mismo schema del formulario antes de pedir
    // otro código, para no gastar un envío con una dirección mal escrita.
    if (!(await trigger("email"))) return;

    setIsResending(true);
    const { resendConfirmation } = createBrowserAuthServices();
    const result = await resendConfirmation.execute(getValues("email"));
    setIsResending(false);

    if (!result.ok) {
      setFormError(result.message);
      return;
    }

    setNotice("Te enviamos un código nuevo. Revisa tu email.");
  }

  return (
    <form
      onSubmit={handleSubmit(onSubmit)}
      noValidate
      className="mt-6 flex flex-col gap-4"
    >
      <div className="flex flex-col gap-1.5">
        <label htmlFor="email" className="text-sm font-medium">
          Email
        </label>
        <input
          id="email"
          type="email"
          autoComplete="email"
          placeholder="tu@email.com"
          className="h-11 rounded-md border border-input bg-card px-3 text-sm outline-none transition-colors focus-visible:border-foreground/40 focus-visible:ring-2 focus-visible:ring-ring/40"
          aria-invalid={!!errors.email}
          {...register("email")}
        />
        {errors.email && (
          <p className="text-xs text-destructive" role="alert">
            {errors.email.message}
          </p>
        )}
      </div>

      <div className="flex flex-col gap-1.5">
        <label htmlFor="token" className="text-sm font-medium">
          Código de confirmación
        </label>
        <input
          id="token"
          type="text"
          inputMode="numeric"
          autoComplete="one-time-code"
          maxLength={6}
          placeholder="123456"
          className="h-11 rounded-md border border-input bg-card py-0 pl-[0.3em] text-center text-base tracking-[0.3em] tabular-nums outline-none transition-colors focus-visible:border-foreground/40 focus-visible:ring-2 focus-visible:ring-ring/40"
          aria-invalid={!!errors.token}
          aria-describedby="token-hint"
          {...register("token")}
        />
        {errors.token ? (
          <p className="text-xs text-destructive" role="alert">
            {errors.token.message}
          </p>
        ) : (
          <p id="token-hint" className="text-xs text-muted-foreground">
            Son 6 dígitos y están en el email que te enviamos.
          </p>
        )}
      </div>

      {formError && (
        <p
          className="rounded-md bg-destructive/10 px-3 py-2 text-sm text-destructive"
          role="alert"
        >
          {formError}
        </p>
      )}

      {notice && (
        <p
          className="rounded-md bg-secondary px-3 py-2 text-sm text-secondary-foreground"
          role="status"
        >
          {notice}
        </p>
      )}

      <button
        type="submit"
        disabled={isSubmitting}
        className="mt-2 h-11 w-full rounded-md bg-primary text-sm font-medium text-primary-foreground transition-colors hover:bg-primary/90 active:scale-[0.98] disabled:cursor-not-allowed disabled:opacity-60"
      >
        {isSubmitting ? "Confirmando…" : "Confirmar cuenta"}
      </button>

      <div className="text-center">
        <button
          type="button"
          onClick={onResend}
          disabled={isResending}
          className="text-sm font-medium text-muted-foreground underline-offset-4 transition-colors hover:text-foreground hover:underline disabled:cursor-not-allowed disabled:opacity-60"
        >
          {isResending ? "Enviando…" : "Reenviar código"}
        </button>
      </div>
    </form>
  );
}
