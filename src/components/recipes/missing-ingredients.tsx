import { Badge } from "@/components/ui/badge";
import { messages } from "@/lib/i18n/messages";
import { cn } from "@/lib/utils";

/**
 * Missing ingredients summary (spec 12, REQ-03; PROMTP #72).
 *
 * Renders required missing items as warning chips and optional ones as outline
 * chips with a muted note. When nothing is missing it shows a calm confirmation.
 * Server-safe.
 */

const ALL_AVAILABLE_MESSAGE = messages.recipes.allAvailable;
const OPTIONAL_NOTE = messages.recipes.optionalNote;

export interface MissingIngredientsProps {
  missing: string[];
  optionalMissing?: string[];
  max?: number;
  title?: string;
  className?: string;
}

export function MissingIngredients({
  missing,
  optionalMissing = [],
  max,
  title,
  className,
}: MissingIngredientsProps) {
  const hasRequired = missing.length > 0;
  const hasOptional = optionalMissing.length > 0;

  if (!hasRequired && !hasOptional) {
    return (
      <p className={cn("text-sm text-muted-foreground", className)}>
        {ALL_AVAILABLE_MESSAGE}
      </p>
    );
  }

  const limit =
    typeof max === "number" && max >= 0 ? Math.min(max, missing.length) : missing.length;
  const visibleRequired = missing.slice(0, limit);
  const hiddenRequiredCount = missing.length - visibleRequired.length;

  return (
    <div className={cn("flex flex-col gap-2", className)}>
      {title ? (
        <span className="text-xs font-medium uppercase tracking-wide text-muted-foreground">
          {title}
        </span>
      ) : null}
      <ul className="flex flex-wrap items-center gap-1.5">
        {visibleRequired.map((name) => (
          <li key={name}>
            <Badge variant="warning">{name}</Badge>
          </li>
        ))}
        {hiddenRequiredCount > 0 ? (
          <li>
            <Badge variant="outline">{`+${hiddenRequiredCount}`}</Badge>
          </li>
        ) : null}
        {optionalMissing.map((name) => (
          <li key={name} className="inline-flex items-center gap-1">
            <Badge variant="outline">{name}</Badge>
            <span className="text-xs text-muted-foreground">
              {OPTIONAL_NOTE}
            </span>
          </li>
        ))}
      </ul>
    </div>
  );
}
