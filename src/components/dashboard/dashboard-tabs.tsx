"use client";

import { useId, useRef, useState, type KeyboardEvent } from "react";
import {
  DashboardControls,
  type DashboardControlsProps,
} from "@/components/dashboard/dashboard-controls";
import { PromptRecipeForm } from "@/components/dashboard/prompt-recipe-form";
import { messages } from "@/lib/i18n/messages";
import { cn } from "@/lib/utils";

/**
 * Dashboard tabs (spec 13 + chef flow).
 *
 * Two entry points to a recipe: the free-text chef request (default, active
 * tab) and the existing structured filters (meal type, cuisine,
 * **Encontrar recetas**).
 *
 * Both panels stay MOUNTED and the inactive one is hidden with the `hidden`
 * attribute: the generated recipe and the prompt text survive a tab switch, and
 * the URL-driven filter controls keep their state. `role="tablist"` with roving
 * `tabIndex` and arrow-key navigation keeps the keyboard contract intact.
 *
 * A Client Component because it owns the active-tab state; `DashboardControls`
 * reads `useSearchParams`, so this must stay inside the page's `<Suspense>`.
 */

type TabId = "prompt" | "filters";

const TAB_ORDER: TabId[] = ["prompt", "filters"];

const TAB_LABELS: Record<TabId, string> = {
  prompt: messages.chef.tabPrompt,
  filters: messages.chef.tabFilters,
};

export type DashboardTabsProps = Omit<DashboardControlsProps, "className"> & {
  className?: string;
};

export function DashboardTabs({
  cuisines,
  initialMealType,
  initialCuisineId,
  mealTypeOptions,
  className,
}: DashboardTabsProps) {
  const [activeTab, setActiveTab] = useState<TabId>("prompt");
  const baseId = useId();
  const tabRefs = useRef<Partial<Record<TabId, HTMLButtonElement | null>>>({});

  const tabId = (tab: TabId) => `${baseId}-tab-${tab}`;
  const panelId = (tab: TabId) => `${baseId}-panel-${tab}`;

  function selectTab(tab: TabId) {
    setActiveTab(tab);
    tabRefs.current[tab]?.focus();
  }

  function handleKeyDown(event: KeyboardEvent<HTMLButtonElement>) {
    const currentIndex = TAB_ORDER.indexOf(activeTab);
    let nextIndex: number | null = null;

    if (event.key === "ArrowRight") {
      nextIndex = (currentIndex + 1) % TAB_ORDER.length;
    } else if (event.key === "ArrowLeft") {
      nextIndex = (currentIndex - 1 + TAB_ORDER.length) % TAB_ORDER.length;
    } else if (event.key === "Home") {
      nextIndex = 0;
    } else if (event.key === "End") {
      nextIndex = TAB_ORDER.length - 1;
    }

    if (nextIndex === null) {
      return;
    }

    event.preventDefault();
    selectTab(TAB_ORDER[nextIndex]);
  }

  return (
    <div className={cn(className)}>
      <div
        role="tablist"
        aria-label={messages.chef.tabsLabel}
        className="flex gap-6 border-b border-border"
      >
        {TAB_ORDER.map((tab) => {
          const isActive = tab === activeTab;
          return (
            <button
              key={tab}
              ref={(node) => {
                tabRefs.current[tab] = node;
              }}
              type="button"
              role="tab"
              id={tabId(tab)}
              aria-selected={isActive}
              aria-controls={panelId(tab)}
              tabIndex={isActive ? 0 : -1}
              onClick={() => selectTab(tab)}
              onKeyDown={handleKeyDown}
              className={cn(
                "-mb-px border-b-2 px-1 pb-3 text-sm font-medium outline-none transition-colors focus-visible:ring-2 focus-visible:ring-ring/40",
                isActive
                  ? "border-foreground text-foreground"
                  : "border-transparent text-muted-foreground hover:text-foreground",
              )}
            >
              {TAB_LABELS[tab]}
            </button>
          );
        })}
      </div>

      <div
        role="tabpanel"
        id={panelId("prompt")}
        aria-labelledby={tabId("prompt")}
        hidden={activeTab !== "prompt"}
        className="pt-6"
      >
        <PromptRecipeForm />
      </div>

      <div
        role="tabpanel"
        id={panelId("filters")}
        aria-labelledby={tabId("filters")}
        hidden={activeTab !== "filters"}
        className="pt-6"
      >
        <DashboardControls
          cuisines={cuisines}
          initialMealType={initialMealType}
          initialCuisineId={initialCuisineId}
          mealTypeOptions={mealTypeOptions}
        />
      </div>
    </div>
  );
}
