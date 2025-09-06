// Non-SKU Product model
// Thin alias over Ingredient to satisfy separate Non-SKU product files requirement
import IngredientModel, { Ingredient } from "./ingredient";

export type NonSKUProduct = Ingredient;

export default IngredientModel;


