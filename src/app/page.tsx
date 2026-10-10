import Link from "next/link";
import { RecipeCard } from "@/components/recipes/recipe-card";
import { RecipeGrid } from "@/components/recipes/recipe-grid";
import { buttonVariants } from "@/components/ui/button";
import type { Recipe } from "@/domain/entities";
import { messages } from "@/lib/i18n/messages";
import { cn } from "@/lib/utils";

/**
 * Landing page (spec 12, REQ-01/REQ-02; PROMTP #39).
 *
 * Server Component: no state, no effects, no data fetching. Every string comes
 * from the centralized Spanish i18n module. The hero headline and the
 * `Comenzar` call to action are fixed by the spec. Reveal animations are
 * progressive enhancement defined in `globals.css` and disabled under
 * `prefers-reduced-motion`.
 */

interface ExampleRecipe {
  recipe: Recipe;
  matchScore: number;
  availableIngredients: string[];
  missingIngredients: string[];
  optionalMissingIngredients: string[];
}

const createdAt = new Date("2026-01-01T00:00:00.000Z");

function makeRecipe(
  overrides: Pick<
    Recipe,
    "id" | "name" | "slug" | "description" | "mealType" | "difficulty"
  > &
    Partial<Recipe>,
): Recipe {
  return {
    cuisineId: "general",
    country: null,
    region: null,
    instructions: "",
    preparationTime: 20,
    cookingTime: 0,
    servings: 2,
    imageUrl: null,
    source: "INTERNAL",
    sourceUrl: null,
    createdAt,
    updatedAt: createdAt,
    ...overrides,
  };
}

const exampleRecipes: ExampleRecipe[] = [
  {
    recipe: makeRecipe({
      id: "example-tortilla",
      name: "Tortilla de patatas",
      slug: "tortilla-de-patatas",
      description:
        "Una tortilla jugosa y dorada, lista con lo que casi siempre tienes en casa.",
      mealType: "LUNCH",
      difficulty: "EASY",
      preparationTime: 30,
      servings: 4,
    }),
    matchScore: 92,
    availableIngredients: ["Papa", "Huevo", "Cebolla", "Aceite de oliva"],
    missingIngredients: [],
    optionalMissingIngredients: [],
  },
  {
    recipe: makeRecipe({
      id: "example-caprese",
      name: "Ensalada caprese",
      slug: "ensalada-caprese",
      description:
        "Fresca y rápida: tomate, albahaca y un buen aceite sobre mozzarella.",
      mealType: "SNACK",
      difficulty: "EASY",
      preparationTime: 10,
    }),
    matchScore: 80,
    availableIngredients: ["Tomate", "Albahaca"],
    missingIngredients: ["Mozzarella"],
    optionalMissingIngredients: ["Aceite de oliva"],
  },
  {
    recipe: makeRecipe({
      id: "example-lentejas",
      name: "Sopa de lentejas",
      slug: "sopa-de-lentejas",
      description:
        "Un guiso reconfortante de olla, ideal para aprovechar la despensa.",
      mealType: "DINNER",
      difficulty: "MEDIUM",
      preparationTime: 15,
      cookingTime: 40,
      servings: 4,
    }),
    matchScore: 66,
    availableIngredients: ["Lentejas", "Zanahoria", "Cebolla"],
    missingIngredients: ["Apio", "Ajo"],
    optionalMissingIngredients: ["Comino"],
  },
];

export default function LandingPage() {
  return (
    <div className="flex min-h-full flex-col">
      <SiteHeader />

      <main className="flex-1">
        <Hero />
        <Examples />
        <Steps />
        <ClosingCta />
      </main>

      <SiteFooter />
    </div>
  );
}

function SiteHeader() {
  return (
    <header className="sticky top-0 z-20 border-b border-border/70 bg-background/80 backdrop-blur">
      <div className="mx-auto flex w-full max-w-6xl items-center justify-between px-6 py-4">
        <Link
          href="/"
          className="flex items-baseline gap-2 rounded-sm outline-none focus-visible:ring-2 focus-visible:ring-ring/40"
        >
          <span className="font-display text-lg font-semibold tracking-tight text-foreground">
            {messages.appName}
          </span>
        </Link>
        <Link
          href="/login"
          className={cn(buttonVariants({ variant: "ghost", size: "sm" }))}
        >
          {messages.landing.hero.secondaryCta}
        </Link>
      </div>
    </header>
  );
}

function Hero() {
  const { hero } = messages.landing;

  return (
    <section className="mx-auto w-full max-w-6xl px-6 pb-16 pt-20 sm:pb-24 sm:pt-28">
      <div className="max-w-3xl">
        <p className="reveal text-xs font-medium uppercase tracking-[0.18em] text-accent-foreground">
          {hero.eyebrow}
        </p>
        <h1
          className="reveal mt-5 font-display text-4xl font-semibold leading-[1.05] tracking-tight text-foreground text-balance sm:text-5xl lg:text-6xl"
          style={{ animationDelay: "60ms" }}
        >
          {hero.headline}
        </h1>
        <p
          className="reveal mt-6 max-w-xl text-lg leading-relaxed text-muted-foreground text-pretty"
          style={{ animationDelay: "120ms" }}
        >
          {hero.subheadline}
        </p>
        <div
          className="reveal mt-9 flex flex-col gap-3 sm:flex-row sm:items-center"
          style={{ animationDelay: "180ms" }}
        >
          <Link
            href="/register"
            className={cn(buttonVariants({ variant: "primary", size: "lg" }))}
          >
            {hero.primaryCta}
          </Link>
          <Link
            href="/login"
            className={cn(buttonVariants({ variant: "secondary", size: "lg" }))}
          >
            {hero.secondaryCta}
          </Link>
        </div>
      </div>
    </section>
  );
}

function Examples() {
  const { examples } = messages.landing;

  return (
    <section className="border-t border-border/70 bg-secondary/40">
      <div className="mx-auto w-full max-w-6xl px-6 py-20">
        <div className="max-w-2xl">
          <h2 className="font-display text-2xl font-semibold tracking-tight text-foreground sm:text-3xl">
            {examples.title}
          </h2>
          <p className="mt-3 text-base leading-relaxed text-muted-foreground text-pretty">
            {examples.description}
          </p>
        </div>

        <RecipeGrid className="mt-10">
          {exampleRecipes.map(
            ({
              recipe,
              matchScore,
              availableIngredients,
              missingIngredients,
              optionalMissingIngredients,
            }) => (
              <RecipeCard
                key={recipe.id}
                recipe={recipe}
                matchScore={matchScore}
                availableIngredients={availableIngredients}
                missingIngredients={missingIngredients}
                optionalMissingIngredients={optionalMissingIngredients}
              />
            ),
          )}
        </RecipeGrid>
      </div>
    </section>
  );
}

function Steps() {
  const { steps } = messages.landing;

  return (
    <section className="mx-auto w-full max-w-6xl px-6 py-20">
      <h2 className="font-display text-2xl font-semibold tracking-tight text-foreground sm:text-3xl">
        {steps.title}
      </h2>

      <ol className="mt-10 grid gap-px overflow-hidden rounded-lg border border-border bg-border sm:grid-cols-2 lg:grid-cols-4">
        {steps.items.map((step, index) => (
          <li key={step.title} className="flex flex-col gap-3 bg-card p-6">
            <span className="font-mono text-xs font-medium tracking-widest text-accent-foreground">
              {String(index + 1).padStart(2, "0")}
            </span>
            <h3 className="text-base font-semibold tracking-tight text-foreground">
              {step.title}
            </h3>
            <p className="text-sm leading-relaxed text-muted-foreground">
              {step.description}
            </p>
          </li>
        ))}
      </ol>
    </section>
  );
}

function ClosingCta() {
  const { closing } = messages.landing;

  return (
    <section className="mx-auto w-full max-w-6xl px-6 pb-24">
      <div className="flex flex-col items-start gap-6 rounded-lg border border-border bg-card p-8 sm:flex-row sm:items-center sm:justify-between sm:p-12">
        <h2 className="max-w-md font-display text-2xl font-semibold tracking-tight text-foreground text-balance sm:text-3xl">
          {closing.title}
        </h2>
        <Link
          href="/register"
          className={cn(buttonVariants({ variant: "primary", size: "lg" }))}
        >
          {closing.primaryCta}
        </Link>
      </div>
    </section>
  );
}

function SiteFooter() {
  return (
    <footer className="border-t border-border/70">
      <div className="mx-auto flex w-full max-w-6xl flex-col gap-2 px-6 py-8 text-sm text-muted-foreground sm:flex-row sm:items-center sm:justify-between">
        <span className="font-display font-semibold text-foreground">
          {messages.appName}
        </span>
        <span>{messages.landing.footer.tagline}</span>
      </div>
    </footer>
  );
}
