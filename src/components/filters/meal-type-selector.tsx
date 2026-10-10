"use client";

import { useRef, type KeyboardEvent } from "react";
import { Button } from "@/components/ui/button";
import type { MealType } from "@/domain/value-objects";
import { defaultMealTypes, mealTypeLabels, messages } from "@/lib/i18n/messages";
import { cn } from "@/lib/utils";

/**
 * Meal type selector (spec 12, REQ-04; PROMTP #40).
 *
 * Client-only radio group: the parent owns the selected value and receives
 * changes through `onChange`. Follows the WAI-ARIA radio group pattern with a
 * roving tabindex, arrow/Home/End keyboard navigation and real <button>
 * elements so Enter/Space also select. Labels come from the centralized i18n
 * messages (Spanish UI copy).
 */
export interface MealTypeSelectorProps {
  value: MealType;
  onChange: (value: MealType) => void;
  options?: MealType[];
  className?: string;
  disabled?: boolean;
}

export function MealTypeSelector({
  value,
  onChange,
  options = defaultMealTypes,
  className,
  disabled = false,
}: MealTypeSelectorProps) {
  const optionRefs = useRef<Array<HTMLButtonElement | null>>([]);

  function selectOption(index: number) {
    const count = options.length;
    if (count === 0) return;
    const nextIndex = (index + count) % count;
    const nextValue = options[nextIndex];
    optionRefs.current[nextIndex]?.focus();
    onChange(nextValue);
  }

  function handleKeyDown(event: KeyboardEvent<HTMLButtonElement>, index: number) {
    switch (event.key) {
      case "ArrowRight":
      case "ArrowDown":
        event.preventDefault();
        selectOption(index + 1);
        break;
      case "ArrowLeft":
      case "ArrowUp":
        event.preventDefault();
        selectOption(index - 1);
        break;
      case "Home":
        event.preventDefault();
        selectOption(0);
        break;
      case "End":
        event.preventDefault();
        selectOption(options.length - 1);
        break;
      default:
        break;
    }
  }

  return (
    <div
      role="radiogroup"
      aria-label={messages.mealTypes.legend}
      aria-disabled={disabled || undefined}
      className={cn("flex flex-wrap gap-2", className)}
    >
      {options.map((option, index) => {
        const isSelected = option === value;
        return (
          <Button
            key={option}
            ref={(node) => {
              optionRefs.current[index] = node;
            }}
            type="button"
            role="radio"
            aria-checked={isSelected}
            tabIndex={isSelected ? 0 : -1}
            variant={isSelected ? "primary" : "secondary"}
            disabled={disabled}
            onClick={() => onChange(option)}
            onKeyDown={(event) => handleKeyDown(event, index)}
          >
            {mealTypeLabels[option]}
          </Button>
        );
      })}
    </div>
  );
}
