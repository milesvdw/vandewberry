import { Route } from "react-router";
import { Ingredient, STATUS } from "./models/ingredient";
import { Recipe } from "./models/recipe";
import * as React from "react";
import { Database } from "./Database";
import { RecipesView } from "./views/recipesview";
import { InventoryView } from "./views/inventoryview";

export interface IRecipeRepo {
    state: { recipes: Recipe[], loading: { recipes: boolean, ingredients: boolean } };
    deleteRecipe(recipe: Recipe): void;
    shareRecipe(recipe: Recipe, household: string): void;
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

export class FoodApp extends React.Component<{}, { recipes: Recipe[], ingredients: Ingredient[], loading: { recipes: boolean, ingredients: boolean } }> implements IRecipeRepo, IIngredientRepo {
    constructor(props: {}) {
        super(props);

        this.state = { recipes: [], ingredients: [], loading: { recipes: true, ingredients: true } };

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
                this.state.loading.recipes = false;
            });

        Database.GetInventory()
            .then((data: any) => {
                this.setState({
                    ingredients: data.map((item: any) => new Ingredient(item)).sort((a: Ingredient, b: Ingredient) => {
                        return a.name.localeCompare(b.name);
                    })
                });
                this.state.loading.ingredients = false;
            });
    }

    public getInventory() {
        return this.state.ingredients.filter((ingredient: Ingredient) => {
            return ingredient.statusID = STATUS.INVENTORY;
        })
    }

    public getArchive() {
        return this.state.ingredients.filter((ingredient: Ingredient) => {
            return ingredient.statusID = STATUS.ARCHIVED;
        })
    }

    public getShoppingList() {
        return this.state.ingredients.filter((ingredient: Ingredient) => {
            return ingredient.statusID = STATUS.SHOPPING;
        })
    }

    public async deleteIngredient(ingredient: Ingredient) {
        ingredient.Delete();
        let ingredients = this.state.ingredients;

        let existingIngredientIndex: number = ingredients.findIndex((searchIngredient: Ingredient) => {
            return searchIngredient.id === ingredient.id;
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
            return searchRecipe.id === recipe.id;
        })
        if (existingRecipeIndex >= 0) {
            recipes.splice(existingRecipeIndex, 1);
            this.setState({ recipes });
        }
    }

    public shareRecipe(recipe: Recipe, household: string) {
        recipe.Share(household);
    }

    public async saveRecipe(recipe: Recipe) {
        let savedRecipe: Recipe = await recipe.Save();
        let recipes = this.state.recipes;

        let existingRecipeIndex: number | undefined = recipes.findIndex((searchRecipe: Recipe) => {
            return searchRecipe.id === savedRecipe.id;
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
            return searchIngredient.id === savedRecipe.id;
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
        ingredient.statusID = STATUS.INVENTORY;
        this.saveIngredient(ingredient);
    }

    public async useUpIngredient(ingredient: Ingredient) {
        ingredient.statusID = STATUS.SHOPPING;
        this.saveIngredient(ingredient);
    }

    public async archiveIngredient(ingredient: Ingredient) {
        ingredient.statusID = STATUS.ARCHIVED;
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
