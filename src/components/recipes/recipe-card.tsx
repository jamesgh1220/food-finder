import Image from "next/image";
import Link from "next/link";
import type { ReactNode } from "react";
import { MissingIngredients } from "@/components/recipes/missing-ingredients";
import { RecipeMatchScore } from "@/components/recipes/recipe-match-score";
import { Badge } from "@/components/ui/badge";
import type { Recipe } from "@/domain/entities";
import { difficultyLabels, mealTypeLabels, messages } from "@/lib/i18n/messages";
import { cn } from "@/lib/utils";

/**
 * Recipe card (spec 12, REQ-03; PROMTP #15/#45/#72).
 *
 * Presentational, server-safe. Media uses `next/image` when an image URL is
 * present; otherwise a decorative SVG placeholder fills the frame. The match
 * score is always explained in words, never as a bare number.
 */
export interface RecipeCardProps {
  recipe: Recipe;
  matchScore?: number;
  /**
   * Names of the pantry ingredients this recipe uses (PROMTP #71). The card
   * derives the "Tienes X de Y" wording from it; it is not a raw count.
   */
  availableIngredients?: string[];
  missingIngredients?: string[];
  optionalMissingIngredients?: string[];
  href?: string;
  favoriteAction?: ReactNode;
  className?: string;
}

/** Max available-ingredient chips shown before collapsing into "+N". */
const MAX_AVAILABLE_CHIPS = 4;

/** Decorative bowl-with-steam glyph for recipes without an image. */
function RecipeImagePlaceholder() {
  return (
    <div
      className="flex h-full w-full items-center justify-center bg-accent"
      aria-hidden="true"
    >
      <svg
        className="h-12 w-12 text-accent-foreground/70"
        viewBox="0 0 48 48"
        fill="none"
        stroke="currentColor"
        strokeWidth="2"
        strokeLinecap="round"
        strokeLinejoin="round"
      >
        <path d="M8 24h32" />
        <path d="M10 24c0 9 28 9 28 0" />
        <path d="M19 9v6" />
        <path d="M29 9v6" />
      </svg>
    </div>
  );
}

export function RecipeCard({
  recipe,
  matchScore,
  availableIngredients = [],
  missingIngredients = [],
  optionalMissingIngredients = [],
  href,
  favoriteAction,
  className,
}: RecipeCardProps) {
  const availableCount = availableIngredients.length;
  const totalCount = availableCount + missingIngredients.length;
  const hasAvailable = availableCount > 0;
  const hiddenAvailableCount = Math.max(
    availableCount - MAX_AVAILABLE_CHIPS,
    0,
  );

  const hasMissing =
    missingIngredients.length > 0 || optionalMissingIngredients.length > 0;

  const title = (
    <h3 className="text-base font-semibold leading-snug tracking-tight text-foreground">
      {recipe.name}
    </h3>
  );

  return (
    <article
      className={cn(
        "flex flex-col overflow-hidden rounded-lg border border-border bg-card text-card-foreground transition-shadow hover:shadow-[0_2px_8px_rgba(0,0,0,0.04)]",
        className,
      )}
    >
      <div className="relative aspect-[4/3] w-full overflow-hidden bg-secondary">
        {recipe.imageUrl ? (
          <Image
            src={recipe.imageUrl}
            alt={recipe.name}
            fill
            sizes="(max-width: 640px) 100vw, (max-width: 1024px) 50vw, 33vw"
            className="object-cover"
          />
        ) : (
          <RecipeImagePlaceholder />
        )}
      </div>

      <div className="flex flex-1 flex-col gap-3 p-5">
        <div className="flex flex-wrap items-center gap-1.5">
          <Badge>{mealTypeLabels[recipe.mealType]}</Badge>
          {recipe.difficulty ? (
            <Badge variant="outline">{difficultyLabels[recipe.difficulty]}</Badge>
          ) : null}
        </div>

        {href ? (
          <Link
            href={href}
            className="rounded-sm outline-none focus-visible:ring-2 focus-visible:ring-ring/40"
          >
            {title}
          </Link>
        ) : (
          title
        )}

        {recipe.description ? (
          <p className="line-clamp-2 text-sm leading-relaxed text-muted-foreground">
            {recipe.description}
          </p>
        ) : null}

        {typeof matchScore === "number" ? (
          <RecipeMatchScore
            score={matchScore}
            availableCount={availableCount}
            totalCount={totalCount}
          />
        ) : null}

        {hasAvailable ? (
          <div className="flex flex-col gap-2">
            <span className="text-xs font-medium uppercase tracking-wide text-muted-foreground">
              {messages.recipes.availableLabel}
            </span>
            <ul className="flex flex-wrap items-center gap-1.5">
              {availableIngredients.slice(0, MAX_AVAILABLE_CHIPS).map((name) => (
                <li key={name}>
                  <Badge variant="accent">{name}</Badge>
                </li>
              ))}
              {hiddenAvailableCount > 0 ? (
                <li>
                  <Badge variant="outline">{`+${hiddenAvailableCount}`}</Badge>
                </li>
              ) : null}
            </ul>
          </div>
        ) : null}

        {hasMissing ? (
          <MissingIngredients
            missing={missingIngredients}
            optionalMissing={optionalMissingIngredients}
            title={messages.recipes.missingLabel}
          />
        ) : null}

        {favoriteAction ? (
          <div className="mt-auto flex items-center pt-2">{favoriteAction}</div>
        ) : null}
      </div>
    </article>
  );
}
