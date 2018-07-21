export class Ingredient {
    public _id?: number;
    public name: string = "";
    public category: string = "";
    public last_purchased: any; // TODO: figure out what this should be
    public expires: boolean;
    public shelf_life: number;
    public status: string = "archived";

    public constructor(init?: Partial<Ingredient>) {
        Object.assign(this, init);
    }

    public Save(then: (x: any) => void): void {
        $.ajax({
            url: "/inventory",
            dataType: "json",
            data: JSON.stringify(this),
            method: 'post'
        }).then((data: any) => then(data));
    };
}