import { Ingredient } from "./models/ingredient";
import { Recipe } from "./models/recipe";

export class Database {
    public static async DeleteRecipe(id: number): Promise<boolean> {
        let url: string = "/recipes/delete/"
            + "?id="
            + id;
        let response = await fetch(url);
        return await response.json()
    }

    public static async GetRecipes(): Promise<Recipe[]> {
        let url: string = "/api/recipes";
        let response = await fetch(url);
        return await response.json().then((data: any) => {
            return data.map((item: any) => new Recipe(item))
        })
    }

    public static async GetInventory(): Promise<Ingredient[]> {
        let url: string = "/api/inventory";
        let response = await fetch(url);
        return await response.json().then((data: any) => {
            return data.map((item: any) => new Ingredient(item))
        })
    }
}