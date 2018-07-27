import { Ingredient } from "./models/ingredient";
import { Recipe } from "./models/recipe";

export interface IApiResponse {
    authenticated: boolean
    payload: any
}

export class Database {
    public static DeleteRecipe(id: number): Promise<boolean> {
        let url: string = "/recipes/delete/"
            + "?id="
            + id;
        return fetch(url, { credentials: 'include' })
            .then((data: any) => data.json())
            .then((data: IApiResponse) => {
                if (data.authenticated) {
                    return data.payload;
                }
                else {
                    window.location.hash = '/login'
                    return Promise.reject('not authenticated');
                }
            })
    }

    public static GetRecipes(): Promise<Recipe[]> {
        let url: string = "/api/recipes";
        return fetch(url, { credentials: 'include' })
            .then((data: any) => data.json())
            .then((data: IApiResponse) => {
                if (data.authenticated) {
                    return data.payload;
                }
                else {
                    window.location.hash = '/login'
                    return Promise.reject('not authenticated');
                }
            })
            .then((json: any) => json.map((item: any) => new Recipe(item)))
    }

    public static GetInventory(): Promise<Ingredient[]> {
        let url: string = "/api/inventory";
        return fetch(url, { credentials: 'include' })
            .then((data: any) => data.json())
            .then((data: IApiResponse) => {
                if (data.authenticated) {
                    return data.payload;
                }
                else {
                    window.location.hash = '/login'
                    return Promise.reject('not authenticated');
                }
            })
            .then((payload: any) => {
                return payload.map((item: any) => new Ingredient(item))
            })
    }

    public static Login(user: string, password: string): Promise<boolean> {
        let url: string = "/api/login";
        return fetch(url, {
            headers: {
                'Accept': 'application/json',
                'Content-Type': 'application/json'
            },
            credentials: 'include',
            body: JSON.stringify({ username: user, password }),
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
}