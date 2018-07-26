import { Route } from "react-router";
import { Ingredient } from "./models/ingredient";
import { Recipe } from "./models/recipe";
import * as React from "react";
import { Database } from "./database";
import { RecipesView } from "./views/recipesview";
import { InventoryView } from "src/views/inventoryview";

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
    saveIngredient(ingredient: Ingredient): void;
}

export class FoodApp extends React.Component<{}, { recipes: Recipe[], ingredients: Ingredient[] }> implements IRecipeRepo, IIngredientRepo {
    constructor(props: {}) {
        super(props);
        this.state = { recipes: [], ingredients: [] };

        this.deleteRecipe = this.deleteRecipe.bind(this);
        this.saveRecipe = this.saveRecipe.bind(this);
        this.componentDidMount = this.componentDidMount.bind(this);
    }

    public componentDidMount() {
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

    public async saveIngredient(ingredient: Ingredient) {
        let savedRecipe: Ingredient = await ingredient.Save();
        let ingredients = this.state.ingredients;

        let existingIngredientIndex: number | undefined = ingredients.findIndex((searchIngredient: Ingredient) => {
            return searchIngredient._id === savedRecipe._id;
        })
        if (existingIngredientIndex >= 0) {
            ingredients.splice(existingIngredientIndex, 1);
        }

        ingredients.push(savedRecipe);

        this.setState({ ingredients });
    }

    public async purchaseIngredient(ingredient: Ingredient) {
        ingredient.status = 'inventory';
        this.saveIngredient(ingredient);
    }

    public async useUpIngredient(ingredient: Ingredient) {
        ingredient.status = 'shopping';
        this.saveIngredient(ingredient);
    }

    public async archiveIngredient(ingredient: Ingredient) {
        ingredient.status = 'archived';
        this.saveIngredient(ingredient);
    }

    public render() {
        return (
            <div>
                <Route path="/inventory"
                    component={() =>
                        <InventoryView repo={this} />
                    }
                />
                <Route path="/recipes"
                    component={() =>
                        <RecipesView repo={this} />
                    }
                />
            </div>
        );
    }
}
