import { Ingredient } from "./models/ingredient";
import { Recipe } from "./models/recipe";

export class Database {
    public static DeleteRecipe(id: number): Promise<boolean> {
        let url: string = "/recipes/delete/"
            + "?id="
            + id;
        return fetch(url)
            .then((data: any) => data.json())
    }

    public static GetRecipes(): Promise<Recipe[]> {
        let url: string = "/api/recipes";
        return fetch(url)
            .then((data: any) => data.json())
            .then((json: any) => json.map((item: any) => new Recipe(item)))
    }

    public static GetInventory(): Promise<Ingredient[]> {
        let url: string = "/api/inventory";
        return fetch(url)
            .then((response: any) => response.json())
            .then((json: any) => json.map((item: any) => new Ingredient(item)))
    }
}