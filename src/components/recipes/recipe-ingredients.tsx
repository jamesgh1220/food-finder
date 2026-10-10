import { cn } from "@/lib/utils";

/**
 * Recipe ingredients list (spec 12, REQ-03; PROMTP #10).
 *
 * Renders a semantic list of quantity/unit + name with an optional tag. The
 * view type is intentionally decoupled from the domain entity so callers can
 * pass a projection without importing infrastructure types. Server-safe.
 */
export interface RecipeIngredientView {
  name: string;
  quantity?: string | number;
  unit?: string;
  optional?: boolean;
  notes?: string | null;
}

export interface RecipeIngredientsProps {
  ingredients: RecipeIngredientView[];
  className?: string;
}

export function RecipeIngredients({
  ingredients,
  className,
}: RecipeIngredientsProps) {
  return (
    <ul className={cn("flex flex-col gap-2", className)}>
      {ingredients.map((item, index) => {
        const amount = [item.quantity, item.unit]
          .filter(
            (part) => part !== undefined && part !== null && `${part}` !== "",
          )
          .join(" ");

        return (
          <li
            key={`${item.name}-${index}`}
            className="flex flex-wrap items-baseline gap-x-2 text-sm"
          >
            {amount ? (
              <span className="font-medium tabular-nums text-foreground">
                {amount}
              </span>
            ) : null}
            <span className="text-foreground">{item.name}</span>
            {item.optional ? (
              <span className="text-xs text-muted-foreground">(opcional)</span>
            ) : null}
            {item.notes ? (
              <span className="text-xs text-muted-foreground">{item.notes}</span>
            ) : null}
          </li>
        );
      })}
    </ul>
  );
}
