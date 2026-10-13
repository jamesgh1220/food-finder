"use client";

import { useState, useTransition } from "react";
import {
  addPantryIngredientAction,
  clearUserPantryAction,
  removePantryIngredientAction,
  searchIngredientsAction,
  updatePantryIngredientAction,
  type PantryActionResult,
} from "@/app/dashboard/pantry/actions";
import { IngredientSearch } from "@/components/ingredients/ingredient-search";
import type { PantryItemData } from "@/components/pantry/pantry-item";
import { PantryList } from "@/components/pantry/pantry-list";
import { EmptyState } from "@/components/shared/empty-state";
import { ErrorState } from "@/components/shared/error-state";
import { Button } from "@/components/ui/button";
import type { Ingredient } from "@/domain/entities";
import { messages } from "@/lib/i18n/messages";
import { cn } from "@/lib/utils";

/**
 * Pantry manager (spec 13, T5; PROMTP #41/#45).
 *
 * Client container that wires `IngredientSearch` + `PantryList` + the
 * "Limpiar despensa" flow to the pantry Server Actions. The server passes the
 * initial items; local state keeps the list responsive between mutations while
 * a `refresh()` on the server re-renders the authoritative payload, which flows
 * back through `initialItems`. No global state: local React state only.
 */
export interface PantryManagerProps {
  initialItems: PantryItemData[];
  className?: string;
}

/** Sensible defaults when an ingredient is added from the combobox. */
const DEFAULT_ADD_QUANTITY = 1;
const DEFAULT_ADD_UNIT = "unidad";

/** Shown when an action rejects before returning a result of its own. */
const ACTION_ERROR_FALLBACK =
  "No pudimos completar la acción. Inténtalo de nuevo.";

/** Replaces an existing row (matched by id) or appends the new one. */
function upsertItem(
  items: PantryItemData[],
  next: PantryItemData,
): PantryItemData[] {
  if (!items.some((item) => item.id === next.id)) {
    return [...items, next];
  }
  return items.map((item) => (item.id === next.id ? next : item));
}

export function PantryManager({
  initialItems,
  className,
}: PantryManagerProps) {
  const [items, setItems] = useState(initialItems);
  const [previousItems, setPreviousItems] = useState(initialItems);
  const [pendingId, setPendingId] = useState<string | null>(null);
  const [actionError, setActionError] = useState<string | null>(null);
  const [isClearing, setIsClearing] = useState(false);
  const [isConfirmingClear, setIsConfirmingClear] = useState(false);
  const [isPending, startTransition] = useTransition();

  // Re-seed local state when the server sends fresh data (same conditional
  // render-phase pattern used by `FavoriteButton`): setState inside a
  // conditional render block is the intended escape hatch for prop-derived
  // state, which the `react-hooks/set-state-in-render` rule still allows.
  if (previousItems !== initialItems) {
    setPreviousItems(initialItems);
    setItems(initialItems);
  }

  const isBusy = isPending || pendingId !== null || isClearing;

  function runAction(
    pendingKey: string | null,
    action: () => Promise<PantryActionResult>,
    onSuccess: (() => void) | undefined,
  ) {
    setActionError(null);
    setPendingId(pendingKey);
    startTransition(async () => {
      let result: PantryActionResult;
      try {
        result = await action();
      } catch {
        result = { ok: false, message: ACTION_ERROR_FALLBACK };
      }
      if (result.ok) {
        onSuccess?.();
      } else {
        setActionError(result.message);
      }
      setPendingId(null);
    });
  }

  function handleSelectIngredient(ingredient: Ingredient) {
    const next: PantryItemData = {
      id: ingredient.id,
      name: ingredient.name,
      quantity: DEFAULT_ADD_QUANTITY,
      unit: DEFAULT_ADD_UNIT,
    };
    runAction(
      ingredient.id,
      () =>
        addPantryIngredientAction({
          ingredientId: ingredient.id,
          quantity: next.quantity,
          unit: next.unit,
        }),
      () => setItems((current) => upsertItem(current, next)),
    );
  }

  function handleUpdate(
    id: string,
    values: { quantity: number; unit: string },
  ) {
    runAction(
      id,
      () => updatePantryIngredientAction({ ingredientId: id, ...values }),
      () =>
        setItems((current) =>
          current.map((item) =>
            item.id === id ? { ...item, ...values } : item,
          ),
        ),
    );
  }

  function handleRemove(id: string) {
    runAction(
      id,
      () => removePantryIngredientAction({ ingredientId: id }),
      () => setItems((current) => current.filter((item) => item.id !== id)),
    );
  }

  function handleConfirmClear() {
    setIsConfirmingClear(false);
    setActionError(null);
    setIsClearing(true);
    startTransition(async () => {
      let result: PantryActionResult;
      try {
        result = await clearUserPantryAction();
      } catch {
        result = { ok: false, message: ACTION_ERROR_FALLBACK };
      }
      if (result.ok) {
        setItems([]);
      } else {
        setActionError(result.message);
      }
      setIsClearing(false);
    });
  }

  return (
    <div className={cn("flex flex-col gap-10", className)}>
      <section
        aria-labelledby="pantry-add-heading"
        className="rounded-lg border border-border bg-card p-6"
      >
        <h2
          id="pantry-add-heading"
          className="font-display text-lg font-semibold tracking-tight text-foreground"
        >
          {messages.pantry.addToPantry}
        </h2>
        <IngredientSearch
          className="mt-4 max-w-md"
          placeholder={messages.pantry.searchPlaceholder}
          onSearch={searchIngredientsAction}
          onSelect={handleSelectIngredient}
        />
      </section>

      <section
        aria-labelledby="pantry-list-heading"
        className="flex flex-col gap-4"
      >
        <div className="flex flex-wrap items-center justify-between gap-3">
          <div className="flex items-baseline gap-3">
            <h2
              id="pantry-list-heading"
              className="font-display text-lg font-semibold tracking-tight text-foreground"
            >
              {messages.dashboard.pantrySection}
            </h2>
            <span className="text-sm text-muted-foreground">
              {messages.pantry.itemsCount(items.length)}
            </span>
          </div>

          {isConfirmingClear ? (
            <div
              role="group"
              aria-label={messages.pantry.clearConfirm}
              className="flex flex-col items-start gap-3 sm:flex-row sm:items-center"
            >
              <p className="max-w-xs text-sm leading-relaxed text-muted-foreground">
                {messages.pantry.clearConfirm}
              </p>
              <div className="flex items-center gap-2">
                <Button
                  type="button"
                  variant="destructive"
                  size="md"
                  onClick={handleConfirmClear}
                  disabled={isBusy}
                >
                  {messages.pantry.clear}
                </Button>
                <Button
                  type="button"
                  variant="secondary"
                  size="md"
                  onClick={() => setIsConfirmingClear(false)}
                  disabled={isBusy}
                >
                  {messages.pantry.cancel}
                </Button>
              </div>
            </div>
          ) : (
            <Button
              type="button"
              variant="secondary"
              size="md"
              onClick={() => setIsConfirmingClear(true)}
              disabled={items.length === 0 || isBusy}
            >
              {messages.pantry.clear}
            </Button>
          )}
        </div>

        {actionError ? (
          <ErrorState
            title={messages.states.error.title}
            description={actionError}
          />
        ) : null}

        <PantryList
          items={items}
          onUpdate={handleUpdate}
          onRemove={handleRemove}
          pendingId={pendingId}
          emptyState={
            <EmptyState
              title={messages.pantry.emptyTitle}
              description={messages.pantry.emptyDescription}
            />
          }
        />
      </section>
    </div>
  );
}
