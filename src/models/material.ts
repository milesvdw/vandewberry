import { Ingredient } from "./ingredient";
import { isIngredientAvailable } from "../utils/recipes";

export class Material {
    public ingredients: Ingredient[] = [new Ingredient()];
    public quantity: string = "";
    public required: boolean = true;

    public constructor(init?: Partial<Material>) {
        Object.assign(this, init);
        this.required = this.required === true || this.required as any === 'true';
        if (init && this.ingredients.length > 0 && !(this.ingredients[0] instanceof Ingredient)) {
            this.ingredients = this.ingredients.map((i) => {
                return new Ingredient(i)
            });
        }
    }

    public isAvailable(ingredients: Ingredient[]): boolean {
        return this.ingredients.some((ingredient) => isIngredientAvailable(ingredient, ingredients));
    }

    public print() {
        let quantity: string = this.quantity ? this.quantity + ' ' : '';
        let ingredients = this.ingredients.map((ingredient) => ingredient.name).join(' or ');
        return quantity + ingredients;
    }
};