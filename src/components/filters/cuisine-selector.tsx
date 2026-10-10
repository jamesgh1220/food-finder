"use client";

import { useId, type ChangeEvent } from "react";
import { Label } from "@/components/ui/label";
import { messages } from "@/lib/i18n/messages";
import { cn } from "@/lib/utils";

/**
 * Cuisine selector (spec 12, REQ-04; PROMTP #41).
 *
 * Native <select> styled to match the Input tokens. `value === null` means
 * "all cuisines"; the empty option maps back to `null` on change. The parent
 * owns the value and the option list.
 */
export interface CuisineOption {
  id: string;
  name: string;
}

export interface CuisineSelectorProps {
  cuisines: CuisineOption[];
  value: string | null;
  onChange: (value: string | null) => void;
  className?: string;
  disabled?: boolean;
}

export function CuisineSelector({
  cuisines,
  value,
  onChange,
  className,
  disabled = false,
}: CuisineSelectorProps) {
  const selectId = useId();

  function handleChange(event: ChangeEvent<HTMLSelectElement>) {
    const next = event.target.value;
    onChange(next === "" ? null : next);
  }

  return (
    <div className={cn("flex flex-col gap-1.5", className)}>
      <Label htmlFor={selectId}>{messages.cuisines.label}</Label>
      <select
        id={selectId}
        value={value ?? ""}
        disabled={disabled}
        onChange={handleChange}
        className="h-11 w-full rounded-md border border-input bg-card px-3 text-sm text-foreground outline-none transition-colors focus-visible:border-foreground/40 focus-visible:ring-2 focus-visible:ring-ring/40 disabled:cursor-not-allowed disabled:opacity-60"
      >
        <option value="">{messages.cuisines.all}</option>
        {cuisines.map((cuisine) => (
          <option key={cuisine.id} value={cuisine.id}>
            {cuisine.name}
          </option>
        ))}
      </select>
    </div>
  );
}
