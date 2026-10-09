import type { SupabaseClient } from "@supabase/supabase-js";
import type {
  RecipeRecommendationCatalog,
  RecipeRecommendationCatalogFilter,
} from "@/application/ports/recipe-recommendation";
import type { RecipeRecommendationCandidate } from "@/domain/entities";
import type { Database } from "@/types/database.types";
import { normalizeIngredientName } from "@/domain/normalization/ingredient-normalizer";
import { toRecipe } from "../mappers";
import { toRepositoryError } from "./repository-error";

export function createSupabaseRecipeRecommendationCatalog(
  client: SupabaseClient<Database>,
): RecipeRecommendationCatalog {
  return {
    async findCandidates(filter: RecipeRecommendationCatalogFilter = {}) {
      let query = client
        .from("recipes")
        .select("*, recipe_ingredients(*, ingredients(*))")
        .eq("source", "INTERNAL");

      if (filter.cuisineId) query = query.eq("cuisine_id", filter.cuisineId);
      if (filter.mealType && filter.mealType !== "ANY") {
        query = query.eq("meal_type", filter.mealType);
      }
      if (filter.maxPreparationTime !== undefined) {
        query = query.lte("preparation_time", filter.maxPreparationTime);
      }
      if (filter.difficulty) query = query.eq("difficulty", filter.difficulty);

      const { data, error } = await query.order("name", { ascending: true });
      if (error) {
        throw toRepositoryError(
          "No se pudieron obtener recetas para recomendaciones.",
          error,
        );
      }

      return (data ?? []).map((row): RecipeRecommendationCandidate => ({
        recipe: toRecipe(row),
        ingredients: (row.recipe_ingredients ?? []).flatMap((relation) => {
          const ingredient = relation.ingredients;
          if (!ingredient) return [];
          return [
            {
              id: ingredient.id,
              name: ingredient.name,
              normalizedName:
                ingredient.normalized_name ||
                normalizeIngredientName(ingredient.name),
              isPantryStaple: ingredient.is_pantry_staple ?? false,
              optional: relation.optional,
            },
          ];
        }),
      }));
    },
  };
}
