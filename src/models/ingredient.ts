import { Database } from "../database";

export class Ingredient {
    public _id?: string;
    public name: string = "";
    public category: string = "";
    public last_purchased: any; // TODO: figure out what this should be
    public expires: boolean;
    public shelf_life: number;
    public status: string = "archived";

    public constructor(init?: Partial<Ingredient>) {
        Object.assign(this, init);
    }

    public Save(): Promise<Ingredient> {
        return Database.ApiCall('/api/inventory', {
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