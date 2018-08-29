import { Material } from "./material";
import { Ingredient } from "./ingredient";
import { Database } from "../Database";

export class Recipe {
    public _id?: string;
    public materials: Material[] = [new Material()]; // each top-level item represents a list of ingredients which may replace/substitute each other
    public description: string = "";
    public name: string = "";
    public calories: number = 0;
    public lastEaten: Date  = new Date(3000,0);

    public constructor(init?: Partial<Recipe>) {
        Object.assign(this, init);

        if (!(this.lastEaten instanceof Date)) {
            this.lastEaten = new Date(this.lastEaten);
        }
        // make sure materials have been constructed (this is only an issue if they just came from the database)
        if (init && this.materials.length > 0 && !(this.materials[0] instanceof Material)) {
            this.materials = this.materials.map((m) => {
                return new Material(m)
            });
        }
    }

    public lastEatenString(): string{
        return this.lastEaten.getTime() < Date.now()? this.lastEaten.toDateString(): 'Never';
    }

    public toLowerCaseRecipe(): Recipe{
        let recipe = this;
        recipe.name = this.name.toLowerCase();
        recipe.materials.forEach(material => {
            material.ingredients.forEach(ingredient => {
                ingredient = ingredient.toLowerCaseIngredient();
            });
        });
        return recipe;
    }

    public Save(): Promise<Recipe> {
        let recipe = this.toLowerCaseRecipe();
        return Database.ApiCall('/api/recipes', {
            headers: {
                'Accept': 'application/json',
                'Content-Type': 'application/json'
            },
            body: JSON.stringify(recipe),
            method: 'post',
        }).then(async (id: string) => {
            recipe._id = id;
            return recipe;
        });
    }

    public Delete(): Promise<boolean> {
        return Database.ApiCall('/api/recipes', {
            headers: {
                'Accept': 'application/json',
                'Content-Type': 'application/json'
            },
            body: JSON.stringify(this),
            method: 'delete',
        }).then((data: any) => {
            return true;
        });
    }

    public ParseIngredients(): Recipe {
        let parsedMaterials: Material[] = this.materials.map((ingredientRow) => { // TODO: I think there ought to be a better way to map the selector to the list than this...
            let quantity: string = ingredientRow.quantity;
            let ingredients: Ingredient[] = ingredientRow.ingredients[0].name.split(',').map((i) => {
                return new Ingredient({
                    name: i.trim()
                });
            });
            let required: boolean = ingredientRow.required;

            return new Material({
                ingredients,
                quantity,
                required
            });
        }) || [];
        this.materials = parsedMaterials || [];
        return this;
    }

    public UnparseIngredients(): Recipe {
        this.materials = this.materials.map((material: Material) => {
            let combinedIngredient: Ingredient = material.ingredients[0];
            combinedIngredient.name = material.ingredients.map((ingredient) => ingredient.name).join(', ');
            return new Material({
                ingredients: [combinedIngredient],
                quantity: material.quantity,
                required: material.required
            });
        });
        return this;
    }
}