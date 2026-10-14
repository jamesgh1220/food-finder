"use client";

import { usePathname, useRouter, useSearchParams } from "next/navigation";
import {
  CuisineSelector,
  type CuisineOption,
} from "@/components/filters/cuisine-selector";
import { MealTypeSelector } from "@/components/filters/meal-type-selector";
import { Button } from "@/components/ui/button";
import { isMealType, type MealType } from "@/domain/value-objects";
import { messages } from "@/lib/i18n/messages";
import { cn } from "@/lib/utils";

/**
 * Dashboard controls (spec 13, REQ-01/REQ-04/REQ-06; PROMTP #40/#70).
 *
 * Client-only interactive block. The URL is the single source of truth: the
 * meal-type and cuisine selectors rewrite the query string with `router.replace`
 * (keeping the existing params and any future ones), and the **Encontrar
 * recetas** button is a progressive GET form to `/dashboard/recipes` that carries
 * the chosen filters. The dashboard is the search entry; the results live on the
 * recipes route (spec 14, REQ-01). No data is fetched here and no global state is
 * introduced.
 *
 * The server passes the initial URL values and the cuisine catalog; those props
 * are the SSR baseline, while `useSearchParams` keeps the controls in sync
 * during client-side transitions. Because the hook reads URL data, the
 * component must render inside a `<Suspense>` boundary (the page provides one).
 */
export interface DashboardControlsProps {
  cuisines: CuisineOption[];
  initialMealType: MealType;
  initialCuisineId: string | null;
  mealTypeOptions?: MealType[];
  className?: string;
}

export function DashboardControls({
  cuisines,
  initialMealType,
  initialCuisineId,
  mealTypeOptions,
  className,
}: DashboardControlsProps) {
  const pathname = usePathname();
  const searchParams = useSearchParams();
  const router = useRouter();

  const mealTypeParam = searchParams.get("mealType");
  const mealType: MealType = isMealType(mealTypeParam)
    ? mealTypeParam
    : initialMealType;

  const cuisineParam = searchParams.get("cuisineId");
  const cuisineId: string | null =
    cuisineParam === null
      ? initialCuisineId
      : cuisineParam.length > 0
        ? cuisineParam
        : null;

  function updateParams(updates: Record<string, string | null>) {
    const next = new URLSearchParams(searchParams.toString());
    for (const [key, value] of Object.entries(updates)) {
      if (value === null || value === "") {
        next.delete(key);
      } else {
        next.set(key, value);
      }
    }
    const query = next.toString();
    router.replace(query ? `${pathname}?${query}` : pathname, {
      scroll: false,
    });
  }

  return (
    <div className={cn("flex flex-col gap-6", className)}>
      <div className="flex flex-col gap-2">
        <span className="text-sm font-medium text-foreground">
          {messages.mealTypes.label}
        </span>
        <MealTypeSelector
          value={mealType}
          options={mealTypeOptions}
          onChange={(value) => updateParams({ mealType: value })}
        />
      </div>

      <CuisineSelector
        cuisines={cuisines}
        value={cuisineId}
        onChange={(value) => updateParams({ cuisineId: value })}
        className="max-w-xs"
      />

      <form action="/dashboard/recipes" method="get">
        <input type="hidden" name="mealType" value={mealType} />
        {cuisineId ? (
          <input type="hidden" name="cuisineId" value={cuisineId} />
        ) : null}
        <Button type="submit" size="lg" className="w-full sm:w-auto">
          {messages.dashboard.findRecipes}
        </Button>
      </form>
    </div>
  );
}
