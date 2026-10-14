"use client";

import { useMemo, useState } from "react";
import { FavoriteToggle } from "@/components/favorites/favorite-toggle";
import { RecipeCard } from "@/components/recipes/recipe-card";
import { RecipeGrid } from "@/components/recipes/recipe-grid";
import { EmptyState } from "@/components/shared/empty-state";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { messages } from "@/lib/i18n/messages";
import type { Recipe } from "@/domain/entities";
import { cn } from "@/lib/utils";

/**
 * Favorites list (spec 14, REQ-03/REQ-08/REQ-10; PROMTP #44; Caso 6).
 *
 * Client container for the saved recipes: a local, accent-insensitive name
 * search over the list the server already loaded (no extra request, no global
 * state) and a grid of `RecipeCard`s whose favorite action is the persistent
 * `FavoriteToggle`. Removing a favorite goes through the Server Action, which
 * re-renders the route and drops the card from the authoritative payload.
 */
export interface FavoritesListProps {
  recipes: Recipe[];
  className?: string;
}

/** Lowercase, accent-stripped key used for the local name search. */
function normalizeName(value: string): string {
  return value
    .normalize("NFD")
    .replace(/[\u0300-\u036f]/g, "")
    .toLowerCase()
    .trim();
}

export function FavoritesList({ recipes, className }: FavoritesListProps) {
  const [query, setQuery] = useState("");
  const normalizedQuery = normalizeName(query);

  const visibleRecipes = useMemo(
    () =>
      normalizedQuery.length === 0
        ? recipes
        : recipes.filter((recipe) =>
            normalizeName(recipe.name).includes(normalizedQuery),
          ),
    [recipes, normalizedQuery],
  );

  return (
    <div className={cn("flex flex-col gap-8", className)}>
      <div className="flex max-w-sm flex-col gap-1.5">
        <Label htmlFor="favorites-search">
          {messages.favorites.searchLabel}
        </Label>
        <Input
          id="favorites-search"
          type="search"
          value={query}
          placeholder={messages.favorites.searchPlaceholder}
          onChange={(event) => setQuery(event.target.value)}
        />
      </div>

      {visibleRecipes.length === 0 ? (
        <EmptyState title={messages.favorites.noMatches} description="" />
      ) : (
        <RecipeGrid>
          {visibleRecipes.map((recipe) => (
            <RecipeCard
              key={recipe.id}
              recipe={recipe}
              href={`/dashboard/recipes/${recipe.id}`}
              favoriteAction={
                <FavoriteToggle
                  recipeId={recipe.id}
                  isFavorite
                  recipeName={recipe.name}
                />
              }
            />
          ))}
        </RecipeGrid>
      )}
    </div>
  );
}
