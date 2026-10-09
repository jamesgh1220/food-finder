import type { AuthPort } from "@/application/ports/auth";
import type { RecipeRecommendationService } from "@/application/ports/recipe-recommendation";
import type {
  CuisineRepository,
  FavoriteRepository,
  PantryRepository,
  RecipeRepository,
} from "@/domain/ports";
import { AddPantryIngredient } from "@/application/pantry/add-pantry-ingredient";
import { UpdatePantryIngredient } from "@/application/pantry/update-pantry-ingredient";
import { RemovePantryIngredient } from "@/application/pantry/remove-pantry-ingredient";
import { GetUserPantry } from "@/application/pantry/get-user-pantry";
import { ClearUserPantry } from "@/application/pantry/clear-user-pantry";
import { FindRecipesFromPantry } from "@/application/recipes/find-recipes-from-pantry";
import { GetRecipeById } from "@/application/recipes/get-recipe-by-id";
import { SearchRecipes } from "@/application/recipes/search-recipes";
import { GetRecipesByMealType } from "@/application/recipes/get-recipes-by-meal-type";
import { GetCuisines } from "@/application/cuisine/get-cuisines";
import { GetCuisineById } from "@/application/cuisine/get-cuisine-by-id";
import { AddFavoriteRecipe } from "@/application/favorites/add-favorite-recipe";
import { RemoveFavoriteRecipe } from "@/application/favorites/remove-favorite-recipe";
import { GetFavoriteRecipes } from "@/application/favorites/get-favorite-recipes";
import { createAuthServices, type AuthServices } from "@/lib/composition/auth";

/**
 * Composition root de la capa application (spec 07).
 *
 * Es el ÚNICO lugar donde los casos de uso de aplicación se atan a puertos
 * concretos. Los tests inyectan puertos falsos aquí; los adapters reales
 * (Supabase, Gemini) llegan en la spec 08 y NO se importan desde este
 * archivo. Sin frameworks de DI: funciones y argumentos explícitos.
 */
export interface ApplicationDependencies {
  auth: AuthPort;
  pantry: PantryRepository;
  recipes: RecipeRepository;
  cuisines: CuisineRepository;
  favorites: FavoriteRepository;
  recommendations: RecipeRecommendationService;
}

export interface ApplicationServices extends AuthServices {
  addPantryIngredient: AddPantryIngredient;
  updatePantryIngredient: UpdatePantryIngredient;
  removePantryIngredient: RemovePantryIngredient;
  getUserPantry: GetUserPantry;
  clearUserPantry: ClearUserPantry;
  findRecipesFromPantry: FindRecipesFromPantry;
  getRecipeById: GetRecipeById;
  searchRecipes: SearchRecipes;
  getRecipesByMealType: GetRecipesByMealType;
  getCuisines: GetCuisines;
  getCuisineById: GetCuisineById;
  addFavoriteRecipe: AddFavoriteRecipe;
  removeFavoriteRecipe: RemoveFavoriteRecipe;
  getFavoriteRecipes: GetFavoriteRecipes;
}

export function createApplicationServices(
  deps: ApplicationDependencies,
): ApplicationServices {
  return {
    ...createAuthServices(deps.auth),
    addPantryIngredient: new AddPantryIngredient(deps.pantry, deps.auth),
    updatePantryIngredient: new UpdatePantryIngredient(deps.pantry, deps.auth),
    removePantryIngredient: new RemovePantryIngredient(deps.pantry, deps.auth),
    getUserPantry: new GetUserPantry(deps.pantry, deps.auth),
    clearUserPantry: new ClearUserPantry(deps.pantry, deps.auth),
    findRecipesFromPantry: new FindRecipesFromPantry(
      deps.recommendations,
      deps.auth,
    ),
    getRecipeById: new GetRecipeById(deps.recipes),
    searchRecipes: new SearchRecipes(deps.recipes),
    getRecipesByMealType: new GetRecipesByMealType(deps.recipes),
    getCuisines: new GetCuisines(deps.cuisines),
    getCuisineById: new GetCuisineById(deps.cuisines),
    addFavoriteRecipe: new AddFavoriteRecipe(
      deps.favorites,
      deps.recipes,
      deps.auth,
    ),
    removeFavoriteRecipe: new RemoveFavoriteRecipe(deps.favorites, deps.auth),
    getFavoriteRecipes: new GetFavoriteRecipes(
      deps.favorites,
      deps.recipes,
      deps.auth,
    ),
  };
}
