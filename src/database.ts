import { Ingredient } from "./models/ingredient";
import { Recipe } from "./models/recipe";
import { Image } from "./models/image";

export interface IApiResponse {
    authenticated: boolean
    payload: any
}

export class Database {
    public static DeleteRecipe(id: number): Promise<boolean> {
        let url: string = "/recipes/delete/"
            + "?id="
            + id;
        return this.ApiCall(url)
    }

    public static GetPhotos(): Promise<Image[]> {
        let url: string = "/api/photos";
        return this.ApiCall(url)
            .then((json: any) => json.map((item: any) => new Image(item)))
    }

    public static GetRecipes(): Promise<Recipe[]> {
        let url: string = "/api/recipes";
        return this.ApiCall(url)
            .then((json: any) => json.map((item: any) => new Recipe(item)))
    }

    public static GetInventory(): Promise<Ingredient[]> {
        let url: string = "/api/inventory";
        return this.ApiCall(url)
            .then((payload: any) => {
                return payload.map((item: any) => new Ingredient(item))
            })
    }

    public static ApiCall(url: string, options: any = {}) {
        options.credentials = 'include';
        return fetch(url, options)
            .then((data: any) => data.json())
            .then((data: IApiResponse) => {
                if (data.authenticated) {
                    return data.payload;
                }
                else {
                    window.location.hash = '/login'
                    return Promise.reject('not authenticated');
                }
            });
    }

    public static Login(username: string, password: string): Promise<boolean> {
        let url: string = "/api/login";
        return fetch(url, {
            headers: {
                'Accept': 'application/json',
                'Content-Type': 'application/json'
            },
            credentials: 'include',
            body: JSON.stringify({ username, password }),
            method: 'post',
        })
            .then((data: any) => {
                return data.json();
            }).then((response: IApiResponse) => {
                if (response.authenticated) {
                    return true;
                } else {
                    window.location.hash = '/login'
                    return false;
                }
            }, () => {
                window.location.hash = '/login'
                return false;
            })
    }

    public static CreateAccount(username: string, password: string, household: string): Promise<boolean> {
        let url: string = "/api/createAccount";
        return fetch(url, {
            headers: {
                'Accept': 'application/json',
                'Content-Type': 'application/json'
            },
            credentials: 'include',
            body: JSON.stringify({ username, password, household }),
            method: 'post',
        })
            .then((data: any) => {
                return data.json();
            }).then((response: IApiResponse) => {
                if (response.authenticated) {
                    return true;
                } else {
                    return false;
                }
            }, () => {
                return false;
            })
    }
}