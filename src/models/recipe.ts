import { Material } from "./material";
import { Ingredient } from "./ingredient";
import { Database } from "../database";

export class Recipe {
    public _id?: string;
    public materials: Material[] = [new Material()]; // each top-level item represents a list of ingredients which may replace/substitute each other
    public description: string = "";
    public name: string = "";

    public constructor(init?: Partial<Recipe>) {
        Object.assign(this, init);


        // make sure materials have been constructed (this is only an issue if they just came from the database)
        if (init && this.materials.length > 0 && !(this.materials[0] instanceof Material)) {
            this.materials = this.materials.map((m) => {
                return new Material(m)
            });
        }
    }

    public Save(): Promise<Recipe> {
        return Database.ApiCall('/api/recipes', {
            headers: {
                'Accept': 'application/json',
                'Content-Type': 'application/json'
            },
            body: JSON.stringify(this),
            method: 'post',
        }).then(async (id: string) => {
            this._id = id;
            return this;
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