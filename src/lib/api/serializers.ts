import type { Recipe, Cuisine, PantryItem, Ingredient } from "@/domain/entities";
import type { RecommendedRecipe } from "@/application/ports/recipe-recommendation";

export function serializeRecipe(recipe: Recipe) {
  return {
    id: recipe.id,
    name: recipe.name,
    slug: recipe.slug,
    description: recipe.description,
    cuisineId: recipe.cuisineId,
    country: recipe.country,
    region: recipe.region,
    mealType: recipe.mealType,
    instructions: recipe.instructions,
    preparationTime: recipe.preparationTime,
    cookingTime: recipe.cookingTime,
    servings: recipe.servings,
    difficulty: recipe.difficulty,
    imageUrl: recipe.imageUrl,
    source: recipe.source,
    sourceUrl: recipe.sourceUrl,
    createdAt: recipe.createdAt,
    updatedAt: recipe.updatedAt,
  };
}

export function serializeCuisine(cuisine: Cuisine) {
  return {
    id: cuisine.id,
    name: cuisine.name,
    slug: cuisine.slug,
    country: cuisine.country,
    region: cuisine.region,
    description: cuisine.description,
    createdAt: cuisine.createdAt,
    updatedAt: cuisine.updatedAt,
  };
}

export function serializePantryItem(item: PantryItem) {
  return {
    id: item.id,
    ingredientId: item.ingredientId,
    quantity: item.quantity.value,
    unit: item.unit.value,
    createdAt: item.createdAt,
    updatedAt: item.updatedAt,
  };
}

export function serializeIngredient(ingredient: Ingredient) {
  return {
    id: ingredient.id,
    name: ingredient.name,
    normalizedName: ingredient.normalizedName,
    category: ingredient.category,
    isPantryStaple: ingredient.isPantryStaple,
    createdAt: ingredient.createdAt,
    updatedAt: ingredient.updatedAt,
  };
}

export function serializeRecommendedRecipe(recommended: RecommendedRecipe) {
  return {
    recipe: serializeRecipe(recommended.recipe),
    matchScore: recommended.matchScore.value,
    availableIngredients: recommended.availableIngredients,
    missingIngredients: recommended.missingIngredients,
    optionalMissingIngredients: recommended.optionalMissingIngredients,
  };
}
