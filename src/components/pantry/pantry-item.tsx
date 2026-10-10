"use client";

import { useId, useState, type FormEvent } from "react";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { messages } from "@/lib/i18n/messages";
import { cn } from "@/lib/utils";

/**
 * Single pantry row (spec 12, REQ-06; PROMTP #21/#45).
 *
 * Client-only: the parent owns the data and the async mutations. Display mode
 * shows name + quantity + unit with Editar/Eliminar actions; edit mode swaps in
 * quantity/unit Inputs with Save/Cancel. Both handlers are optional — the
 * matching action only renders when its handler exists. Renders a real <li>.
 */
export interface PantryItemData {
  id: string;
  name: string;
  quantity: number;
  unit: string;
}

export interface PantryItemProps {
  item: PantryItemData;
  onUpdate?: (
    id: string,
    values: { quantity: number; unit: string },
  ) => void | Promise<void>;
  onRemove?: (id: string) => void | Promise<void>;
  pending?: boolean;
  className?: string;
}

export function PantryItem({
  item,
  onUpdate,
  onRemove,
  pending = false,
  className,
}: PantryItemProps) {
  const fieldId = useId();
  const quantityId = `${fieldId}-quantity`;
  const unitId = `${fieldId}-unit`;

  const [isEditing, setIsEditing] = useState(false);
  // Draft values for edit mode only; display mode reads straight from `item`.
  const [quantity, setQuantity] = useState(String(item.quantity));
  const [unit, setUnit] = useState(item.unit);

  function startEditing() {
    setQuantity(String(item.quantity));
    setUnit(item.unit);
    setIsEditing(true);
  }

  function cancelEditing() {
    setQuantity(String(item.quantity));
    setUnit(item.unit);
    setIsEditing(false);
  }

  async function handleSave(event: FormEvent<HTMLFormElement>) {
    event.preventDefault();
    if (!onUpdate) return;

    const parsedQuantity = Number(quantity);
    if (!Number.isFinite(parsedQuantity) || parsedQuantity <= 0) return;

    try {
      await onUpdate(item.id, { quantity: parsedQuantity, unit: unit.trim() });
      setIsEditing(false);
    } catch {
      // Keep edit mode open so the user can retry without losing input.
    }
  }

  function handleRemove() {
    if (!onRemove) return;
    void Promise.resolve(onRemove(item.id)).catch(() => undefined);
  }

  if (isEditing) {
    return (
      <li
        className={cn(
          "rounded-md border border-border bg-card p-3",
          className,
        )}
      >
        <form
          onSubmit={handleSave}
          className="flex flex-col gap-3 sm:flex-row sm:items-end"
        >
          <span className="text-sm font-medium text-foreground sm:flex-1">
            {item.name}
          </span>
          <div className="flex flex-col gap-1">
            <Label htmlFor={quantityId}>{messages.pantry.quantity}</Label>
            <Input
              id={quantityId}
              type="number"
              inputMode="decimal"
              min="0"
              step="any"
              value={quantity}
              disabled={pending}
              onChange={(event) => setQuantity(event.target.value)}
              className="w-full sm:w-24"
            />
          </div>
          <div className="flex flex-col gap-1">
            <Label htmlFor={unitId}>{messages.pantry.unit}</Label>
            <Input
              id={unitId}
              type="text"
              value={unit}
              disabled={pending}
              onChange={(event) => setUnit(event.target.value)}
              className="w-full sm:w-28"
            />
          </div>
          <div className="flex items-center gap-2">
            <Button type="submit" size="sm" disabled={pending}>
              {messages.pantry.save}
            </Button>
            <Button
              type="button"
              variant="secondary"
              size="sm"
              onClick={cancelEditing}
              disabled={pending}
            >
              {messages.pantry.cancel}
            </Button>
          </div>
        </form>
      </li>
    );
  }

  return (
    <li
      className={cn(
        "flex flex-wrap items-center justify-between gap-3 rounded-md border border-border bg-card p-3",
        className,
      )}
    >
      <div className="flex flex-wrap items-baseline gap-x-2 gap-y-1">
        <span className="text-sm font-medium text-foreground">
          {item.name}
        </span>
        <span className="text-sm text-muted-foreground">
          {item.quantity} {item.unit}
        </span>
      </div>
      {onUpdate || onRemove ? (
        <div className="flex items-center gap-2">
          {onUpdate ? (
            <Button
              type="button"
              variant="secondary"
              size="sm"
              onClick={startEditing}
              disabled={pending}
              aria-label={`${messages.pantry.edit}: ${item.name}`}
            >
              {messages.pantry.edit}
            </Button>
          ) : null}
          {onRemove ? (
            <Button
              type="button"
              variant="secondary"
              size="sm"
              onClick={handleRemove}
              disabled={pending}
              aria-label={`${messages.pantry.remove}: ${item.name}`}
            >
              {messages.pantry.remove}
            </Button>
          ) : null}
        </div>
      ) : null}
    </li>
  );
}
