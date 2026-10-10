import type { Ingredient } from "@/domain/entities";
import type { IngredientRepository } from "@/domain/ports";

export interface SearchIngredientsInput {
  query?: string;
}

export class SearchIngredients {
  constructor(private readonly ingredients: IngredientRepository) {}

  async execute(input: SearchIngredientsInput = {}): Promise<Ingredient[]> {
    return this.ingredients.findMany(input.query);
  }
}
