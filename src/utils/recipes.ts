
import { compareIngredients } from "./utils";
import { Ingredient } from "../models/ingredient";

export function isIngredientAvailable(ingredient: Ingredient, ingredients: Ingredient[]): boolean {
    let ingredientInStock = ingredients.find( (stockIngredient) => compareIngredients(stockIngredient, ingredient));
    return !!ingredientInStock
}