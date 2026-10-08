"use client";

import { zodResolver } from "@hookform/resolvers/zod";
import { useRouter } from "next/navigation";
import { useState } from "react";
import { useForm } from "react-hook-form";
import type { RegisterValues } from "@/components/auth/auth-schemas";
import { registerSchema } from "@/components/auth/auth-schemas";
import { createBrowserAuthServices } from "@/lib/composition/browser-auth";

export function RegisterForm() {
  const router = useRouter();
  const [formError, setFormError] = useState<string | null>(null);
  const [confirmationNotice, setConfirmationNotice] = useState<string | null>(
    null,
  );
  const {
    register,
    handleSubmit,
    formState: { errors, isSubmitting },
  } = useForm<RegisterValues>({
    resolver: zodResolver(registerSchema),
    defaultValues: { email: "", password: "" },
  });

  async function onSubmit(values: RegisterValues) {
    setFormError(null);
    setConfirmationNotice(null);
    const { registerUser } = createBrowserAuthServices();
    const result = await registerUser.execute(values);

    if (!result.ok) {
      setFormError(result.message);
      return;
    }

    if (result.data.sessionStarted) {
      router.push("/dashboard");
      router.refresh();
      return;
    }

    setConfirmationNotice(
      "Cuenta creada. Revisa tu email para confirmarla y luego inicia sesión.",
    );
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
        <label htmlFor="password" className="text-sm font-medium">
          Contraseña
        </label>
        <input
          id="password"
          type="password"
          autoComplete="new-password"
          placeholder="Mínimo 6 caracteres"
          className="h-11 rounded-md border border-input bg-card px-3 text-sm outline-none transition-colors focus-visible:border-foreground/40 focus-visible:ring-2 focus-visible:ring-ring/40"
          aria-invalid={!!errors.password}
          {...register("password")}
        />
        {errors.password && (
          <p className="text-xs text-destructive" role="alert">
            {errors.password.message}
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

      {confirmationNotice && (
        <p
          className="rounded-md bg-secondary px-3 py-2 text-sm text-secondary-foreground"
          role="status"
        >
          {confirmationNotice}
        </p>
      )}

      <button
        type="submit"
        disabled={isSubmitting}
        className="mt-2 h-11 w-full rounded-md bg-primary text-sm font-medium text-primary-foreground transition-colors hover:bg-primary/90 active:scale-[0.98] disabled:cursor-not-allowed disabled:opacity-60"
      >
        {isSubmitting ? "Creando cuenta…" : "Crear cuenta"}
      </button>
    </form>
  );
}
