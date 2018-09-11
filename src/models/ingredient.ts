// tslint:disable:max-classes-per-file
import { Database } from "../Database";

export class STATUS {
    public static ARCHIVED = 11;
    public static SHOPPING = 1;
    public static INVENTORY = 31;
}
export class Ingredient {
    public id?: number;
    public name: string = "";
    public category: string = "";
    public last_purchased: any; // TODO: figure out what this should be
    public expires: boolean;
    public shelf_life: number;
    public statusID: number = STATUS.ARCHIVED;
    public householdId: string = "";

    public constructor(init?: Partial<Ingredient>) {
        Object.assign(this, init);

        // deal with the fact that bits stored in mysql come back as string :(
        if (this.expires as any === "0") {
            this.expires = false;
        }
        else if (this.expires as any === "1") {
            this.expires = true;
        }
    }

    public Save(): Promise<Ingredient> {
        let ingredient = this.toLowerCaseIngredient();
        return Database.ApiCall('/api/inventory', {
            headers: {
                'Accept': 'application/json',
                'Content-Type': 'application/json'
            },
            body: JSON.stringify(ingredient),
            method: 'post',
        }).then(async (id: number) => {
            ingredient.id = id;
            return ingredient;
        });
    }

    public toLowerCaseIngredient(): Ingredient {
        let ingredient = this;
        ingredient.name = this.name.toLowerCase();
        ingredient.category = this.category.toLowerCase();
        return ingredient;
    }

    public Delete(): Promise<boolean> {
        return Database.ApiCall('/api/inventory', {
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
}