import { messages } from "@/lib/i18n/messages";
import { cn } from "@/lib/utils";

/**
 * Recipe match score (spec 12, REQ-03; PROMTP #15/#72).
 *
 * Rule #72: never surface an abstract number on its own. This module always
 * produces a human sentence, either a percentage or an ingredient count, and
 * pairs it with a decorative progress bar. The accessible name is the visible
 * text, so the bar is hidden from assistive tech and color is never the sole
 * signal.
 */

export interface DescribeMatchScoreOptions {
  availableCount?: number;
  totalCount?: number;
  variant?: "auto" | "percentage" | "ingredients";
}

/** Clamp a score into the inclusive 0..1 range. */
function clamp(value: number, min: number, max: number): number {
  if (Number.isNaN(value)) {
    return min;
  }
  return Math.min(Math.max(value, min), max);
}

/** Rounded whole percentage for the given score. */
function toPercent(score: number): number {
  return Math.round(clamp(score, 0, 1) * 100);
}

/**
 * Build the human-readable match label. Never returns a bare number.
 *
 * - `"<rounded>% de coincidencia"` by default.
 * - `"Tienes <available> de <total> ingredientes"` when both counts are known
 *   and the variant is `"ingredients"` (or `"auto"`).
 */
export function describeMatchScore(
  score: number,
  options: DescribeMatchScoreOptions = {},
): string {
  const { availableCount, totalCount, variant = "auto" } = options;
  const hasCounts =
    typeof availableCount === "number" && typeof totalCount === "number";
  const preferIngredients =
    variant === "ingredients" || (variant === "auto" && hasCounts);

  if (preferIngredients && hasCounts) {
    return messages.matchScore.ingredients(availableCount, totalCount);
  }

  return messages.matchScore.percentage(toPercent(score));
}

export interface RecipeMatchScoreProps {
  score: number;
  availableCount?: number;
  totalCount?: number;
  variant?: "auto" | "percentage" | "ingredients";
  className?: string;
}

export function RecipeMatchScore({
  score,
  availableCount,
  totalCount,
  variant = "auto",
  className,
}: RecipeMatchScoreProps) {
  const label = describeMatchScore(score, {
    availableCount,
    totalCount,
    variant,
  });
  const percent = toPercent(score);

  return (
    <div className={cn("flex flex-col gap-1.5", className)}>
      <span className="text-sm font-medium text-foreground">{label}</span>
      <div
        className="h-1.5 w-full overflow-hidden rounded-full bg-muted"
        aria-hidden="true"
      >
        <div className="h-full bg-primary" style={{ width: `${percent}%` }} />
      </div>
    </div>
  );
}
