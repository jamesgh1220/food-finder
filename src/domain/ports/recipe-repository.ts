import type {
  Recipe,
  RecipeIngredientDetail,
  RecipeIngredientInput,
} from "../entities";
import type { MealType } from "../value-objects";

/** Filtro de búsqueda de recetas usado por los casos de uso (spec 06, REQ-08). */
export interface RecipeFilter {
  cuisineId?: string;
  mealType?: MealType;
  search?: string;
  ids?: string[];
}

/**
 * Puerto de persistencia de recetas (spec 06, REQ-08).
 *
 * Interfaz pura, independiente de Supabase: la implementación vive en
 * infraestructura y es reemplazable por un mock en los tests.
 */
export interface RecipeRepository {
  findById(id: string): Promise<Recipe | null>;
  findBySlug(slug: string): Promise<Recipe | null>;
  findByIds(ids: string[]): Promise<Recipe[]>;
  findMany(filter?: RecipeFilter): Promise<Recipe[]>;
  /**
   * Lee las relaciones receta↔ingrediente con el nombre del ingrediente ya
   * resuelto (spec 14, REQ-02; PROMTP #10/#43).
   *
   * Es una proyección de lectura para la página de detalle: no toca el
   * agregado `Recipe` (que no expone ingredientes) ni exige sesión.
   */
  findIngredients(recipeId: string): Promise<RecipeIngredientDetail[]>;
  /**
   * Persiste una receta nueva junto a sus ingredientes y devuelve la entidad
   * guardada con el `id` y los timestamps asignados por la base de datos
   * (spec 09, REQ-07).
   *
   * Las recetas generadas por el proveedor externo se persisten aquí para
   * tener un identificador estable que usen la página de detalle y favoritos.
   *
   * **Efecto colateral documentado:** los nombres de `ingredients` se resuelven
   * contra el catálogo global `ingredients` por nombre normalizado y, si no
   * existen, se crean. Sin fila de catálogo no hay forma de guardar la relación:
   * `recipe_ingredients.ingredient_id` es `NOT NULL REFERENCES ingredients(id)`.
   *
   * La persistencia de los ingredientes es **degradable**: si falla, la receta
   * ya persistida se devuelve igual y el fallo se registra como `warn`. Nunca se
   * pierde la receta por un ingrediente.
   */
  save(
    recipe: Recipe,
    ingredients: RecipeIngredientInput[],
  ): Promise<Recipe>;
}
