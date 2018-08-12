import { Database } from "../database";

export class Image {
    public _id?: string;
    public url: string = "";
    public description: string = "";
    public title: string = "";
    public rotation: string = "none";
    public date_taken: string = "unknown"

    public constructor(init?: Partial<Image>) {
        Object.assign(this, init);
    }

    public Save(): Promise<Image> {
        return Database.ApiCall('/api/photos', {
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
        return Database.ApiCall('/api/photos', {
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