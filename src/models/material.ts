import { Ingredient } from "./ingredient";
import { isIngredientAvailable } from "../utils/recipes";
import { IngredientGroup } from "./IngredientGroup";

export class Material {
    public id?: number;
    public ingredientgroups: IngredientGroup[] = [new IngredientGroup()];
    public quantity: string = "";
    public required: boolean = true;

    public constructor(init?: Partial<Material>) {
        Object.assign(this, init);
        
        if (init && this.ingredientgroups.length > 0 && !(this.ingredientgroups[0] instanceof IngredientGroup)) {
            this.ingredientgroups = this.ingredientgroups.map((i) => {
                return new IngredientGroup(i)
            });
        }


        // deal with the fact that bits stored in mysql come back as string :(
        if (this.required as any === "0") {
            debugger;
            this.required = false;
        }
        else if (this.required as any === "1") {
            debugger;
            this.required = true;
        }
    }

    public isAvailable(ingredients: Ingredient[]): boolean {
        return this.ingredientgroups.some((ingredientgroup) => isIngredientAvailable(ingredientgroup, ingredients));
    }

    public print() {
        let quantity: string = this.quantity ? this.quantity + ' ' : '';
        let ingredientgroups = this.ingredientgroups.map((ingredient) => ingredient.name).join(' or ');
        return quantity + ingredientgroups;
    }
};