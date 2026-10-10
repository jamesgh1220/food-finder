import { z } from "zod";
import { MEAL_TYPES } from "@/domain/value-objects/meal-type";

export const uuidSchema = z.string().uuid();

export const recipesQuerySchema = z.object({
  search: z.string().optional(),
  mealType: z.enum(MEAL_TYPES).optional(),
  cuisineId: uuidSchema.optional(),
});

export const recipeParamsSchema = z.object({
  id: uuidSchema,
});

export const recommendationsBodySchema = z.object({
  ingredientIds: z.array(uuidSchema),
  mealType: z.enum(MEAL_TYPES).optional(),
  cuisineId: z.union([uuidSchema, z.null()]).optional(),
});

export const ingredientsQuerySchema = z.object({
  search: z.string().optional(),
});

export const ingredientsSearchQuerySchema = z.object({
  query: z.string().min(1),
});

export const cuisinesQuerySchema = z.object({});

export const pantryItemParamsSchema = z.object({
  id: uuidSchema, // ingredientId
});

export const pantryAddBodySchema = z.object({
  ingredientId: uuidSchema,
  quantity: z.number().min(0).finite(),
  unit: z.string().min(1),
});

export const pantryUpdateBodySchema = z.object({
  ingredientId: uuidSchema,
  quantity: z.number().min(0).finite(),
  unit: z.string().min(1),
});

export const favoriteParamsSchema = z.object({
  recipeId: uuidSchema,
});

export const favoriteAddBodySchema = z.object({
  recipeId: uuidSchema,
});
