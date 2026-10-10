"use client";

import {
  useEffect,
  useId,
  useRef,
  useState,
  type ChangeEvent,
  type KeyboardEvent,
} from "react";
import { Label } from "@/components/ui/label";
import type { Ingredient } from "@/domain/entities";
import { messages } from "@/lib/i18n/messages";
import { cn } from "@/lib/utils";

/**
 * Ingredient search combobox (spec 12, REQ-05; PROMTP #18/#45).
 *
 * Client-only accessible combobox: the parent provides the async `onSearch`
 * lookup and receives the picked `Ingredient` through `onSelect`. Queries are
 * debounced and guarded with a request token so out-of-order responses cannot
 * overwrite newer results. Implements the WAI-ARIA combobox pattern
 * (role/aria-expanded/aria-controls/aria-activedescendant/aria-autocomplete).
 *
 * Loading/empty/error are derived during render from the latest resolved
 * result, so the effect body only fetches (`setState` runs in async callbacks),
 * which keeps the React hooks lint rule satisfied without losing feedback.
 */

/** Local copy for strings not present in the centralized i18n module. */
const DEFAULT_LABEL = "Buscar ingrediente";
const DEFAULT_PLACEHOLDER = "Escribe para buscar, por ejemplo: tomate";
const NO_RESULTS = "Sin resultados";
const SEARCH_ERROR = "No pudimos buscar ingredientes. Inténtalo de nuevo.";

export interface IngredientSearchProps {
  onSearch: (query: string) => Promise<Ingredient[]>;
  onSelect: (ingredient: Ingredient) => void;
  label?: string;
  placeholder?: string;
  debounceMs?: number;
  minChars?: number;
  className?: string;
  id?: string;
}

interface ResolvedSearch {
  query: string;
  items: Ingredient[];
  error: boolean;
}

export function IngredientSearch({
  onSearch,
  onSelect,
  label,
  placeholder,
  debounceMs = 250,
  minChars = 1,
  className,
  id,
}: IngredientSearchProps) {
  const generatedId = useId();
  const inputId = id ?? `ingredient-search-${generatedId}`;
  const listboxId = `${inputId}-listbox`;
  const optionId = (index: number) => `${inputId}-option-${index}`;
  const resolvedLabel = label ?? DEFAULT_LABEL;

  const [query, setQuery] = useState("");
  const [result, setResult] = useState<ResolvedSearch | null>(null);
  const [isFocused, setIsFocused] = useState(false);
  const [isDismissed, setIsDismissed] = useState(false);
  const [activeIndex, setActiveIndex] = useState(-1);

  // Latest onSearch kept in a ref so a re-created callback from the parent does
  // not restart the debounce timer.
  const onSearchRef = useRef(onSearch);
  useEffect(() => {
    onSearchRef.current = onSearch;
  }, [onSearch]);

  // Monotonic token: only the newest request may commit its result.
  const requestToken = useRef(0);

  useEffect(() => {
    const trimmed = query.trim();
    if (trimmed.length < minChars) return;

    const token = ++requestToken.current;
    const timer = setTimeout(() => {
      onSearchRef.current(trimmed)
        .then((items) => {
          if (token !== requestToken.current) return;
          setResult({ query: trimmed, items, error: false });
        })
        .catch(() => {
          if (token !== requestToken.current) return;
          setResult({ query: trimmed, items: [], error: true });
        });
    }, debounceMs);

    return () => {
      clearTimeout(timer);
      // Invalidate any in-flight response tied to this effect run.
      requestToken.current += 1;
    };
  }, [query, debounceMs, minChars]);

  const trimmed = query.trim();
  const meetsMinChars = trimmed.length >= minChars;
  const resolved = result && result.query === trimmed ? result : null;
  const results = resolved ? resolved.items : [];
  const isLoading = meetsMinChars && resolved === null;
  const hasError = resolved !== null && resolved.error;
  const showEmpty = resolved !== null && !resolved.error && results.length === 0;
  const isOpen = isFocused && !isDismissed && meetsMinChars;

  const activeIngredient =
    activeIndex >= 0 && activeIndex < results.length
      ? results[activeIndex]
      : undefined;
  const activeDescendant = isOpen && activeIngredient ? optionId(activeIndex) : undefined;

  function selectIngredient(ingredient: Ingredient) {
    onSelect(ingredient);
    requestToken.current += 1;
    setQuery("");
    setResult(null);
    setIsDismissed(true);
    setIsFocused(false);
    setActiveIndex(-1);
  }

  function handleInputChange(event: ChangeEvent<HTMLInputElement>) {
    setQuery(event.target.value);
    setIsDismissed(false);
    setActiveIndex(-1);
  }

  function handleFocus() {
    setIsFocused(true);
    setIsDismissed(false);
  }

  function handleBlur() {
    setIsFocused(false);
    setActiveIndex(-1);
  }

  function handleKeyDown(event: KeyboardEvent<HTMLInputElement>) {
    switch (event.key) {
      case "ArrowDown":
        if (results.length === 0) return;
        event.preventDefault();
        setIsDismissed(false);
        setActiveIndex((current) =>
          current < 0 ? 0 : Math.min(current + 1, results.length - 1),
        );
        break;
      case "ArrowUp":
        if (results.length === 0) return;
        event.preventDefault();
        setActiveIndex((current) =>
          current <= 0 ? 0 : Math.max(current - 1, 0),
        );
        break;
      case "Enter":
        if (isOpen && activeIngredient) {
          event.preventDefault();
          selectIngredient(activeIngredient);
        }
        break;
      case "Escape":
        setIsDismissed(true);
        setActiveIndex(-1);
        break;
      case "Tab":
        setIsDismissed(true);
        setActiveIndex(-1);
        break;
      default:
        break;
    }
  }

  const hasOptions = !isLoading && !hasError && results.length > 0;

  return (
    <div className={cn("relative flex flex-col gap-1.5", className)}>
      <Label htmlFor={inputId}>{resolvedLabel}</Label>
      <input
        id={inputId}
        type="text"
        role="combobox"
        aria-expanded={isOpen}
        aria-controls={listboxId}
        aria-activedescendant={activeDescendant}
        aria-autocomplete="list"
        autoComplete="off"
        value={query}
        placeholder={placeholder ?? DEFAULT_PLACEHOLDER}
        onChange={handleInputChange}
        onFocus={handleFocus}
        onBlur={handleBlur}
        onKeyDown={handleKeyDown}
        className="h-11 w-full rounded-md border border-input bg-card px-3 text-sm text-foreground outline-none transition-colors placeholder:text-muted-foreground focus-visible:border-foreground/40 focus-visible:ring-2 focus-visible:ring-ring/40"
      />

      {isOpen ? (
        <div className="absolute top-full z-10 mt-1 w-full rounded-md border border-border bg-card py-1 shadow-[0_2px_8px_rgba(0,0,0,0.04)]">
          {isLoading ? (
            <p role="status" className="px-3 py-2 text-sm text-muted-foreground">
              {messages.states.loading}
            </p>
          ) : null}
          {hasError ? (
            <p role="alert" className="px-3 py-2 text-sm text-muted-foreground">
              {SEARCH_ERROR}
            </p>
          ) : null}
          {showEmpty ? (
            <p className="px-3 py-2 text-sm text-muted-foreground">
              {NO_RESULTS}
            </p>
          ) : null}
          <ul
            id={listboxId}
            role="listbox"
            aria-label={resolvedLabel}
            className="flex flex-col"
          >
            {hasOptions
              ? results.map((ingredient, index) => (
                  <li
                    key={ingredient.id}
                    id={optionId(index)}
                    role="option"
                    aria-selected={index === activeIndex}
                    className={cn(
                      "cursor-pointer px-3 py-2 text-sm text-foreground",
                      index === activeIndex && "bg-secondary",
                    )}
                    onMouseEnter={() => setActiveIndex(index)}
                    // Keep focus in the input so the click handler fires before
                    // the input's blur closes the listbox.
                    onMouseDown={(event) => event.preventDefault()}
                    onClick={() => selectIngredient(ingredient)}
                  >
                    {ingredient.name}
                  </li>
                ))
              : null}
          </ul>
        </div>
      ) : null}
    </div>
  );
}
