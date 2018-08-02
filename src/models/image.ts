import { Database } from "../database";

export class Image {
    public _id?: string;
    public url: string = "";
    public description: string = "";
    public title: string = "";

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
}