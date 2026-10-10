"use client";

import { useState, useTransition } from "react";
import { Button } from "@/components/ui/button";
import { messages } from "@/lib/i18n/messages";
import { cn } from "@/lib/utils";

/**
 * Favorite toggle (spec 12, REQ-06; PROMTP #24/#45).
 *
 * Client-only, optimistic: local state is seeded from `isFavorite`, synced on
 * prop change, flipped immediately on click and reverted if `onToggle` rejects.
 * Uses a transition so the button disables while the mutation is in flight.
 * The heart is a custom inline SVG with a consistent stroke (no icon library).
 */
export interface FavoriteButtonProps {
  isFavorite: boolean;
  onToggle: (next: boolean) => void | Promise<void>;
  recipeName?: string;
  disabled?: boolean;
  className?: string;
}

function HeartIcon({ filled }: { filled: boolean }) {
  return (
    <svg
      className="h-4 w-4"
      viewBox="0 0 20 20"
      fill={filled ? "currentColor" : "none"}
      stroke="currentColor"
      strokeWidth="1.6"
      strokeLinecap="round"
      strokeLinejoin="round"
      aria-hidden="true"
    >
      <path d="M10 16.5S3.5 12.6 3.5 8.1a3.4 3.4 0 0 1 6.5-1.8 3.4 3.4 0 0 1 6.5 1.8c0 4.5-6.5 8.4-6.5 8.4Z" />
    </svg>
  );
}

export function FavoriteButton({
  isFavorite,
  onToggle,
  recipeName,
  disabled = false,
  className,
}: FavoriteButtonProps) {
  const [optimistic, setOptimistic] = useState(isFavorite);
  const [prevFavorite, setPrevFavorite] = useState(isFavorite);
  const [isPending, startTransition] = useTransition();

  // Re-seed local state when the source of truth changes. This is React's
  // documented "adjusting state when a prop changes" pattern: setState inside a
  // conditional render block is the intended escape hatch and replaces a
  // sync-in-effect that the hooks lint rule (correctly) rejects.
  if (prevFavorite !== isFavorite) {
    setPrevFavorite(isFavorite);
    setOptimistic(isFavorite);
  }

  function handleToggle() {
    const next = !optimistic;
    setOptimistic(next);

    startTransition(async () => {
      try {
        await onToggle(next);
      } catch {
        // Revert only if the value has not changed again in the meantime.
        setOptimistic((current) => (current === next ? !next : current));
      }
    });
  }

  const label = optimistic ? messages.favorites.remove : messages.favorites.add;
  const accessibleName = recipeName ? `${label}: ${recipeName}` : label;

  return (
    <Button
      type="button"
      variant="secondary"
      aria-pressed={optimistic}
      aria-label={accessibleName}
      disabled={disabled || isPending}
      onClick={handleToggle}
      className={cn("gap-2", className)}
    >
      <HeartIcon filled={optimistic} />
      <span>{label}</span>
    </Button>
  );
}
