"use client";

import { Badge } from "@/components/ui/badge";
import { cn } from "@/lib/utils";

/**
 * Selected ingredient chips (spec 12, REQ-05; PROMTP #18/#45).
 *
 * Client-only presentational list: renders the current selection as accent
 * Badges, each paired with an accessible remove button. When empty it shows a
 * muted fallback label.
 */

const DEFAULT_EMPTY_LABEL = "Todavía no agregaste ingredientes.";

export interface SelectedIngredient {
  id: string;
  name: string;
}

export interface IngredientSelectorProps {
  selected: SelectedIngredient[];
  onRemove: (id: string) => void;
  emptyLabel?: string;
  className?: string;
}

export function IngredientSelector({
  selected,
  onRemove,
  emptyLabel,
  className,
}: IngredientSelectorProps) {
  if (selected.length === 0) {
    return (
      <p className={cn("text-sm text-muted-foreground", className)}>
        {emptyLabel ?? DEFAULT_EMPTY_LABEL}
      </p>
    );
  }

  return (
    <ul className={cn("flex flex-wrap items-center gap-2", className)}>
      {selected.map((ingredient) => (
        <li key={ingredient.id} className="inline-flex items-center gap-1">
          <Badge variant="accent">{ingredient.name}</Badge>
          <button
            type="button"
            onClick={() => onRemove(ingredient.id)}
            aria-label={`Quitar ${ingredient.name}`}
            className="inline-flex h-6 w-6 items-center justify-center rounded-md text-muted-foreground outline-none transition-colors hover:bg-secondary hover:text-foreground focus-visible:ring-2 focus-visible:ring-ring/40"
          >
            <svg
              className="h-3.5 w-3.5"
              viewBox="0 0 16 16"
              fill="none"
              stroke="currentColor"
              strokeWidth="1.75"
              strokeLinecap="round"
              aria-hidden="true"
            >
              <path d="M4 4l8 8" />
              <path d="M12 4l-8 8" />
            </svg>
          </button>
        </li>
      ))}
    </ul>
  );
}
