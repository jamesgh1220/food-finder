import type { Metadata } from "next";
import Link from "next/link";
import { LoginForm } from "@/components/auth/login-form";

export const metadata: Metadata = {
  title: "Iniciar sesión | Food Finder",
};

export default function LoginPage() {
  return (
    <div className="flex min-h-screen flex-col items-center justify-center bg-background px-4 py-24 font-sans">
      <main className="w-full max-w-sm">
        <Link
          href="/"
          className="mb-8 block text-center text-base font-serif font-medium text-primary tracking-tight transition-colors hover:text-foreground"
        >
          Food Finder
        </Link>

        <section className="rounded-lg border border-border bg-card p-8">
          <h1 className="text-3xl font-serif font-medium tracking-tight">
            Iniciar sesión
          </h1>
          <p className="mt-1 text-sm leading-relaxed text-muted-foreground">
            Accede a tu despensa y a tus recetas guardadas.
          </p>
          <LoginForm />
        </section>

        <p className="mt-6 text-center text-sm text-muted-foreground">
          ¿No tienes cuenta?{" "}
          <Link
            href="/register"
            className="font-medium text-foreground underline underline-offset-4"
          >
            Crear cuenta
          </Link>
        </p>
      </main>
    </div>
  );
}
