"use client";

import { useState } from "react";
import {
  addFavoriteAction,
  removeFavoriteAction,
} from "@/app/dashboard/favorites/actions";
import { FavoriteButton } from "@/components/favorites/favorite-button";
import { cn } from "@/lib/utils";

/**
 * Favorite toggle container (spec 14, REQ-08; PROMTP #44; Caso 6).
 *
 * Client container that binds the favorites Server Actions to the presentational
 * `FavoriteButton`. The button owns the optimistic flip and the rollback; this
 * container only maps the action result to a user-visible error and swallows the
 * rejection so the button can revert. The server `refresh()` re-renders the
 * authoritative payload, which flows back through `isFavorite`.
 */
export interface FavoriteToggleProps {
  recipeId: string;
  isFavorite: boolean;
  recipeName?: string;
  className?: string;
}

/** Shown when an action rejects before returning a result of its own. */
const ACTION_ERROR_FALLBACK =
  "No pudimos actualizar tus favoritos. Inténtalo de nuevo.";

export function FavoriteToggle({
  recipeId,
  isFavorite,
  recipeName,
  className,
}: FavoriteToggleProps) {
  const [error, setError] = useState<string | null>(null);

  async function handleToggle(next: boolean) {
    setError(null);

    let message: string | null = null;
    try {
      const result = next
        ? await addFavoriteAction({ recipeId })
        : await removeFavoriteAction({ recipeId });
      if (!result.ok) {
        message = result.message;
      }
    } catch {
      message = ACTION_ERROR_FALLBACK;
    }

    if (message) {
      setError(message);
      // Reject so the button reverts its optimistic state.
      throw new Error(message);
    }
  }

  return (
    <div className={cn("flex flex-col gap-2", className)}>
      <FavoriteButton
        isFavorite={isFavorite}
        onToggle={handleToggle}
        recipeName={recipeName}
      />
      {error ? (
        <p role="alert" className="text-sm text-muted-foreground">
          {error}
        </p>
      ) : null}
    </div>
  );
}
