
import { compareIngredients } from "./utils";
import { Ingredient } from "../models/ingredient";
import { IngredientGroup } from "../models/IngredientGroup";

export function isIngredientAvailable(ingredientgroup: IngredientGroup, ingredients: Ingredient[]): boolean {
    let ingredientInStock = ingredients.find( (stockIngredient) => compareIngredients(ingredientgroup, stockIngredient));
    return !!ingredientInStock
}