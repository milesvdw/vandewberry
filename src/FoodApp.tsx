import { Route } from "react-router";
import { Ingredient } from "./models/ingredient";
import { Recipe } from "./models/recipe";
import * as React from "react";
import { Database } from "./database";
import { RecipesView } from "./views/recipesview";

export interface IRecipeRepo {
    state: { recipes: Recipe[] };
    deleteRecipe(recipe: Recipe): void;
    saveRecipe(recipe: Recipe): void;
}

export interface IIngredientRepo {
    state: { ingredients: Ingredient[] };
    archiveIngredient(ingredient: Ingredient): void;
    purchaseIngredient(ingredient: Ingredient): void;
    useUpIngredient(ingredient: Ingredient): void;
}

export class FoodApp extends React.Component<{}, { recipes: Recipe[], ingredients: Ingredient[] }> implements IRecipeRepo, IIngredientRepo {
    constructor(props: {}) {
        super(props);
        this.state = { recipes: [], ingredients: [] };

        Database.GetRecipes()
            .then((data: any) => {
                this.setState({
                    recipes: data.map((item: any) => new Recipe(item))
                });
            });

        Database.GetInventory()
            .then((data: any) => {
                this.setState({
                    ingredients: data.map((item: any) => new Ingredient(item))
                });
            });

        this.deleteRecipe = this.deleteRecipe.bind(this);
        this.saveRecipe = this.saveRecipe.bind(this);
    }

    public async deleteRecipe(recipe: Recipe) {
        recipe.Delete();
        let recipes = this.state.recipes;

        let existingRecipeIndex: number = recipes.findIndex((searchRecipe: Recipe) => {
            return searchRecipe._id === recipe._id;
        })
        if (existingRecipeIndex >= 0) {
            recipes.splice(existingRecipeIndex, 1);
            this.setState({ recipes });
        }
    }

    public async saveRecipe(recipe: Recipe) {
        let savedRecipe: Recipe = await recipe.Save();
        let recipes = this.state.recipes;

        let existingRecipeIndex: number | undefined = recipes.findIndex((searchRecipe: Recipe) => {
            return searchRecipe._id === savedRecipe._id;
        })
        if (existingRecipeIndex >= 0) {
            recipes.splice(existingRecipeIndex, 1);
        }

        recipes.push(savedRecipe);

        this.setState({ recipes });
    }

    public async purchaseIngredient(ingredient: Ingredient) {
        console.log('not implemented');
    }

    public async useUpIngredient(ingredient: Ingredient) {
        console.log('not implemented');
    }

    public async archiveIngredient(ingredient: Ingredient) {
        console.log('not implemented');
    }

    public render() {
        return (
            <div>
                {/* <Route path="inventory">
                  <InventoryView />
                </Route> */}
                <Route path="/recipes"
                    component={() =>
                        <RecipesView repo={this} />
                    }
                />
            </div>
        );
    }
}
