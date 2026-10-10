"use client";

import type { ReactNode } from "react";
import { PantryItem, type PantryItemData } from "@/components/pantry/pantry-item";
import { EmptyState } from "@/components/shared/empty-state";
import { cn } from "@/lib/utils";

/**
 * Pantry list (spec 12, REQ-06; PROMTP #21/#45).
 *
 * Client-only wrapper that renders a semantic <ul> of PantryItem rows and
 * forwards the per-row handlers. Shows the caller's `emptyState` (or the
 * shared EmptyState) when there are no items.
 */
export interface PantryListProps {
  items: PantryItemData[];
  onUpdate?: (
    id: string,
    values: { quantity: number; unit: string },
  ) => void | Promise<void>;
  onRemove?: (id: string) => void | Promise<void>;
  pendingId?: string | null;
  emptyState?: ReactNode;
  className?: string;
}

export function PantryList({
  items,
  onUpdate,
  onRemove,
  pendingId = null,
  emptyState,
  className,
}: PantryListProps) {
  if (items.length === 0) {
    return (
      <div className={className}>{emptyState ?? <EmptyState />}</div>
    );
  }

  return (
    <ul className={cn("flex flex-col gap-2", className)}>
      {items.map((item) => (
        <PantryItem
          key={item.id}
          item={item}
          onUpdate={onUpdate}
          onRemove={onRemove}
          pending={pendingId === item.id}
        />
      ))}
    </ul>
  );
}
