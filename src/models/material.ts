import { Ingredient } from "./ingredient";
import { isIngredientAvailable } from "../utils/recipes";

export class Material {
    public id?: number;
    public ingredientgroups: Ingredient[] = [new Ingredient()];
    public quantity: string = "";
    public required: boolean = true;

    public constructor(init?: Partial<Material>) {
        Object.assign(this, init);
        this.required = this.required === true || this.required as any === 'true';
        if (init && this.ingredientgroups.length > 0 && !(this.ingredientgroups[0] instanceof Ingredient)) {
            this.ingredientgroups = this.ingredientgroups.map((i) => {
                return new Ingredient(i)
            });
        }
    }

    public isAvailable(ingredientgroups: Ingredient[]): boolean {
        return this.ingredientgroups.some((ingredient) => isIngredientAvailable(ingredient, ingredientgroups));
    }

    public print() {
        let quantity: string = this.quantity ? this.quantity + ' ' : '';
        let ingredientgroups = this.ingredientgroups.map((ingredient) => ingredient.name).join(' or ');
        return quantity + ingredientgroups;
    }
};