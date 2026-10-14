"use client";

import { useState, type FormEvent } from "react";
import {
  generateRecipeAction,
  type GenerateRecipeResult,
} from "@/app/dashboard/actions";
import type { GeneratedRecipe } from "@/application/ports/external-recipe-prompt-provider";
import { RECIPE_PROMPT_MAX_LENGTH } from "@/application/recipes/generate-recipe-from-prompt";
import { FavoriteToggle } from "@/components/favorites/favorite-toggle";
import {
  RecipeIngredients,
  type RecipeIngredientView,
} from "@/components/recipes/recipe-ingredients";
import { RecipeInstructions } from "@/components/recipes/recipe-instructions";
import { ErrorState } from "@/components/shared/error-state";
import { LoadingState } from "@/components/shared/loading-state";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardHeader } from "@/components/ui/card";
import { Textarea } from "@/components/ui/textarea";
import {
  difficultyLabels,
  mealTypeLabels,
  messages,
  recipeSourceLabels,
} from "@/lib/i18n/messages";
import { cn } from "@/lib/utils";

/**
 * Chef prompt form (dashboard tab 1).
 *
 * Client container between the free-text request and `generateRecipeAction`.
 * Gemini answers as a chef and the recipe renders INLINE (never a redirect to
 * the detail route): the recipe row is persisted without its ingredient rows,
 * so the validated response is the only complete source of ingredients and
 * steps. Because both tab panels stay mounted, the result survives switching
 * tabs.
 *
 * The `id` returned by the action belongs to an already persisted recipe, so
 * the inline `FavoriteToggle` can save it.
 */

export interface PromptRecipeFormProps {
  className?: string;
}

const PROMPT_FIELD_ID = "chef-prompt";

/** Projects the generated ingredients onto the presentational view. */
function toIngredientViews(recipe: GeneratedRecipe): RecipeIngredientView[] {
  return recipe.ingredients.map((ingredient) => ({
    name: ingredient.name,
    quantity: ingredient.quantity ?? undefined,
    unit: ingredient.unit ?? undefined,
    optional: ingredient.optional,
  }));
}

/** Inline rendering of one generated recipe. */
function GeneratedRecipeView({ recipe }: { recipe: GeneratedRecipe }) {
  const meta = [
    recipe.cuisineName,
    mealTypeLabels[recipe.mealType],
    recipe.difficulty ? difficultyLabels[recipe.difficulty] : null,
    messages.recipeDetail.minutes(recipe.preparationTimeMinutes),
    messages.recipeDetail.servingsValue(recipe.servings),
  ].filter((part): part is string => Boolean(part));

  return (
    <section aria-labelledby="chef-result-title">
      <h2
        id="chef-result-title"
        className="font-display text-xl font-semibold tracking-tight text-foreground"
      >
        {messages.chef.resultTitle}
      </h2>

      <Card className="mt-4">
        <CardHeader className="gap-3">
          <Badge variant="accent" className="self-start">
            {recipeSourceLabels[recipe.source]}
          </Badge>
          <h3 className="font-display text-2xl font-semibold leading-tight tracking-tight text-foreground">
            {recipe.name}
          </h3>
          {recipe.description ? (
            <p className="text-sm leading-relaxed text-muted-foreground text-pretty">
              {recipe.description}
            </p>
          ) : null}
          <p className="text-sm text-muted-foreground">{meta.join(" · ")}</p>
        </CardHeader>

        <CardContent className="flex flex-col gap-8">
          <div className="flex flex-col gap-3">
            <h4 className="text-sm font-medium uppercase tracking-wide text-muted-foreground">
              {messages.recipeDetail.ingredients}
            </h4>
            <RecipeIngredients ingredients={toIngredientViews(recipe)} />
          </div>

          <div className="flex flex-col gap-3">
            <h4 className="text-sm font-medium uppercase tracking-wide text-muted-foreground">
              {messages.recipeDetail.instructions}
            </h4>
            <RecipeInstructions instructions={recipe.instructions.join("\n")} />
          </div>

          <FavoriteToggle recipeId={recipe.id} isFavorite={false} recipeName={recipe.name} />
        </CardContent>
      </Card>
    </section>
  );
}

export function PromptRecipeForm({ className }: PromptRecipeFormProps) {
  const [prompt, setPrompt] = useState("");
  const [result, setResult] = useState<GenerateRecipeResult | null>(null);
  const [isPending, setIsPending] = useState(false);

  const trimmedPrompt = prompt.trim();
  const canSubmit =
    trimmedPrompt.length > 0 &&
    trimmedPrompt.length <= RECIPE_PROMPT_MAX_LENGTH &&
    !isPending;

  async function handleSubmit(event: FormEvent<HTMLFormElement>) {
    event.preventDefault();
    if (!canSubmit) {
      return;
    }

    setIsPending(true);
    setResult(null);
    try {
      const next = await generateRecipeAction({ prompt: trimmedPrompt });
      setResult(next);
    } catch {
      // The action normalizes domain failures itself; this covers a transport
      // or composition failure so the form never crashes.
      setResult({ ok: false, message: messages.chef.errorDescription });
    } finally {
      setIsPending(false);
    }
  }

  const errorMessage = result && !result.ok ? result.message : null;

  return (
    <div className={cn("flex flex-col gap-8", className)}>
      <form onSubmit={handleSubmit} className="flex flex-col gap-3">
        <label
          htmlFor={PROMPT_FIELD_ID}
          className="text-sm font-medium text-foreground"
        >
          {messages.chef.promptLabel}
        </label>
        <Textarea
          id={PROMPT_FIELD_ID}
          name="prompt"
          value={prompt}
          onChange={(event) => setPrompt(event.target.value)}
          placeholder={messages.chef.promptPlaceholder}
          maxLength={RECIPE_PROMPT_MAX_LENGTH}
          aria-invalid={errorMessage ? true : undefined}
          aria-describedby={`${PROMPT_FIELD_ID}-hint`}
          disabled={isPending}
        />
        <p
          id={`${PROMPT_FIELD_ID}-hint`}
          className="text-xs leading-relaxed text-muted-foreground"
        >
          {messages.chef.promptHint}
        </p>
        <Button
          type="submit"
          size="lg"
          className="self-start"
          disabled={!canSubmit}
        >
          {messages.chef.submit}
        </Button>
      </form>

      {isPending ? <LoadingState label={messages.chef.loading} /> : null}

      {errorMessage ? (
        <ErrorState
          title={messages.chef.errorTitle}
          description={errorMessage}
        />
      ) : null}

      {result?.ok ? <GeneratedRecipeView recipe={result.recipe} /> : null}
    </div>
  );
}
