import type { Metadata } from "next";
import Link from "next/link";
import { redirect } from "next/navigation";
import { Suspense } from "react";
import {
  PantryManager,
  type PantryItemData,
} from "@/components/pantry";
import { ErrorState } from "@/components/shared/error-state";
import { LoadingState } from "@/components/shared/loading-state";
import { createServerApplicationServices } from "@/lib/composition/server-application";
import { createServerAuthServices } from "@/lib/composition/server-auth";
import { UnauthorizedError } from "@/domain/errors";
import { messages } from "@/lib/i18n/messages";

export const metadata: Metadata = {
  title: "Despensa | Food Finder",
};

/**
 * Pantry route (spec 13, T5; REQ-02/REQ-03/REQ-08; PROMTP #41).
 *
 * Server Component: loads the pantry and the ingredient catalog in parallel
 * (the `PantryItem` name gap is resolved by mapping `ingredientId` against the
 * catalog once) and serializes plain `PantryItemData` rows for the client
 * container. Mutations travel through Server Actions, never through `/api/*`
 * (hop rule, spec 02 REQ-11). The shared authenticated header lives in
 * `dashboard/layout.tsx`.
 *
 * Local copy: the back-link label has no centralized i18n key yet.
 */
const BACK_TO_DASHBOARD = "Volver al dashboard";

export default function PantryPage() {
  return (
    <Suspense fallback={<PantryFallback />}>
      <PantryContent />
    </Suspense>
  );
}

function PantryFallback() {
  return (
    <main className="mx-auto w-full max-w-5xl px-6 py-20">
      <LoadingState label={messages.states.loading} />
    </main>
  );
}

async function PantryContent() {
  // Second line of defence after `src/proxy.ts`; also the server context where
  // `GetCurrentUser` runs. `redirect` throws, so it is called before any catch.
  const { getCurrentUser } = await createServerAuthServices();
  const authResult = await getCurrentUser.execute();

  if (!authResult.ok || !authResult.data) {
    redirect("/login");
  }

  const services = await createServerApplicationServices();

  let items: PantryItemData[] = [];
  let loadFailed = false;

  try {
    const [pantry, ingredients] = await Promise.all([
      services.getUserPantry.execute(),
      services.searchIngredients.execute({}),
    ]);

    // Name gap: PantryItem carries only `ingredientId`, so display names are
    // resolved once from the ingredient catalog.
    const ingredientNames = new Map(
      ingredients.map((ingredient) => [ingredient.id, ingredient.name]),
    );
    items = pantry.map((item) => ({
      id: item.ingredientId,
      name:
        ingredientNames.get(item.ingredientId) ??
        messages.pantry.unknownIngredient,
      quantity: item.quantity.value,
      unit: item.unit.value,
    }));
  } catch (error) {
    // A session that expired between the check above and these calls must not
    // degrade to a generic error: send the user back to `/login`.
    if (error instanceof UnauthorizedError) {
      redirect("/login");
    }
    loadFailed = true;
  }

  return (
    <main className="mx-auto w-full max-w-5xl px-6 py-12">
      <Link
        href="/dashboard"
        className="inline-flex items-center gap-1.5 rounded-sm text-sm text-muted-foreground outline-none transition-colors hover:text-foreground focus-visible:ring-2 focus-visible:ring-ring/40"
      >
        <svg
          className="h-4 w-4"
          viewBox="0 0 16 16"
          fill="none"
          stroke="currentColor"
          strokeWidth="1.6"
          strokeLinecap="round"
          strokeLinejoin="round"
          aria-hidden="true"
        >
          <path d="M9.5 3.5 5 8l4.5 4.5" />
          <path d="M5 8h8" />
        </svg>
        {BACK_TO_DASHBOARD}
      </Link>

      <header className="mt-6 max-w-2xl">
        <h1 className="font-display text-3xl font-semibold leading-tight tracking-tight text-foreground sm:text-4xl">
          {messages.dashboard.pantrySection}
        </h1>
      </header>

      <div className="mt-8">
        {loadFailed ? (
          <ErrorState
            title={messages.states.error.title}
            description={messages.states.error.description}
          />
        ) : (
          <PantryManager initialItems={items} />
        )}
      </div>
    </main>
  );
}
