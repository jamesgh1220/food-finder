import type { Metadata } from "next";
import Link from "next/link";
import { RegisterForm } from "@/components/auth/register-form";

export const metadata: Metadata = {
  title: "Crear cuenta | Food Finder",
};

export default function RegisterPage() {
  return (
    <div className="flex min-h-screen flex-col items-center justify-center bg-background px-4 py-24 font-sans">
      <main className="w-full max-w-sm">
        <Link
          href="/"
          className="mb-8 block text-center text-base font-display font-medium text-primary tracking-tight transition-colors hover:text-foreground"
        >
          Food Finder
        </Link>

        <section className="rounded-lg border border-border bg-card p-8">
          <h1 className="text-3xl font-display font-medium tracking-tight">
            Crear cuenta
          </h1>
          <p className="mt-1 text-sm leading-relaxed text-muted-foreground">
            Guarda tu despensa y tus recetas favoritas.
          </p>
          <RegisterForm />
        </section>

        <p className="mt-6 text-center text-sm text-muted-foreground">
          ¿Ya tienes cuenta?{" "}
          <Link
            href="/login"
            className="font-medium text-foreground underline underline-offset-4"
          >
            Iniciar sesión
          </Link>
        </p>
      </main>
    </div>
  );
}
