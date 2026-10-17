import type { Metadata } from "next";
import Link from "next/link";
import { Suspense } from "react";
import { ConfirmRegistrationForm } from "@/components/auth/confirm-registration-form";

export const metadata: Metadata = {
  title: "Confirmar cuenta | Food Finder",
};

type ConfirmPageProps = {
  searchParams: Promise<{ email?: string | string[] | undefined }>;
};

/** Solo se usa el primer valor si el email llega repetido en la query. */
function readEmail(value: string | string[] | undefined): string {
  if (Array.isArray(value)) return value[0] ?? "";
  return value ?? "";
}

export default function ConfirmPage({ searchParams }: ConfirmPageProps) {
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
            Confirma tu cuenta
          </h1>
          <p className="mt-1 text-sm leading-relaxed text-muted-foreground">
            Escribe el código de 6 dígitos que enviamos a tu email.
          </p>

          {/* `searchParams` es dinámico: con Cache Components va dentro de un
              Suspense para que el resto de la página siga siendo estático. */}
          <Suspense fallback={<ConfirmFormFallback />}>
            <ConfirmFormSection searchParams={searchParams} />
          </Suspense>
        </section>

        <p className="mt-6 text-center text-sm text-muted-foreground">
          ¿Ya confirmaste?{" "}
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

async function ConfirmFormSection({ searchParams }: ConfirmPageProps) {
  const email = readEmail((await searchParams).email);
  return <ConfirmRegistrationForm defaultEmail={email} />;
}

function ConfirmFormFallback() {
  return (
    <div className="mt-6 flex flex-col gap-4" aria-hidden="true">
      <div className="h-11 rounded-md bg-secondary" />
      <div className="h-11 rounded-md bg-secondary" />
      <div className="mt-2 h-11 rounded-md bg-secondary" />
    </div>
  );
}
