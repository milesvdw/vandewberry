import { Route } from "react-router";
import { Ingredient } from "./models/ingredient";
import { Recipe } from "./models/recipe";
import * as React from "react";
import { Database } from "./database";
import { RecipesView } from "./views/recipesview";
import { InventoryView } from "./views/inventoryview";

export interface IRecipeRepo {
    state: { recipes: Recipe[] };
    deleteRecipe(recipe: Recipe): void;
    saveRecipe(recipe: Recipe): void;
    refresh(): void;
}

export interface IIngredientRepo {
    state: { ingredients: Ingredient[] };
    archiveIngredient(ingredient: Ingredient): void;
    purchaseIngredient(ingredient: Ingredient): void;
    useUpIngredient(ingredient: Ingredient): void;
    saveIngredient(ingredient: Ingredient): void;
    deleteIngredient(ingredient: Ingredient): void;
    refresh(): void;
}

export class FoodApp extends React.Component<{}, { recipes: Recipe[], ingredients: Ingredient[] }> implements IRecipeRepo, IIngredientRepo {
    constructor(props: {}) {
        super(props);
        this.state = { recipes: [], ingredients: [] };

        this.deleteRecipe = this.deleteRecipe.bind(this);
        this.deleteIngredient = this.deleteIngredient.bind(this);
        this.saveRecipe = this.saveRecipe.bind(this);
        this.componentDidMount = this.componentDidMount.bind(this);
        this.refresh = this.refresh.bind(this);
    }

    public componentDidMount() {
        this.refresh();
    }
    // TODO: Consider splitting this refresh between recipes and ingredients
    public refresh() {
        Database.GetRecipes()
            .then((data: any) => {
                this.setState({
                    recipes: data.map((item: any) => new Recipe(item))
                });
            });

        Database.GetInventory()
            .then((data: any) => {
                this.setState({
                    ingredients: data.map((item: any) => new Ingredient(item)).sort((a: Ingredient, b: Ingredient) => {
                        return a.name.localeCompare(b.name);
                    })
                });
            });
    }

    public getInventory() {
        return this.state.ingredients.filter((ingredient: Ingredient) => {
            return ingredient.status === 'inventory';
        })
    }

    public getArchive() {
        return this.state.ingredients.filter((ingredient: Ingredient) => {
            return ingredient.status === 'archived';
        })
    }

    public getShoppingList() {
        return this.state.ingredients.filter((ingredient: Ingredient) => {
            return ingredient.status === 'shopping';
        })
    }

    public async deleteIngredient(ingredient: Ingredient) {
        ingredient.Delete();
        let ingredients = this.state.ingredients;

        let existingIngredientIndex: number = ingredients.findIndex((searchIngredient: Ingredient) => {
            return searchIngredient._id === ingredient._id;
        })
        if (existingIngredientIndex >= 0) {
            ingredients.splice(existingIngredientIndex, 1);
            this.setState({ ingredients });
        }
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

        recipes = recipes.sort((a: Recipe, b: Recipe) => {
            return a.name.localeCompare(b.name);
        })

        this.setState({ recipes });
    }

    public async saveIngredient(ingredient: Ingredient) {
        ingredient = ingredient.toLowerCaseIngredient();
        let savedRecipe: Ingredient = await ingredient.Save();
        let ingredients = this.state.ingredients;

        let existingIngredientIndex: number | undefined = ingredients.findIndex((searchIngredient: Ingredient) => {
            return searchIngredient._id === savedRecipe._id;
        })
        
        if (existingIngredientIndex >= 0) {
            ingredients.splice(existingIngredientIndex, 1);
        }

        ingredients.push(savedRecipe);

        ingredients = ingredients.sort((a: Ingredient, b: Ingredient) => {
            return a.name.localeCompare(b.name);
        })

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
