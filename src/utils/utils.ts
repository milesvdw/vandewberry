import { Ingredient } from "../models/ingredient";
import { ajax } from "jquery";

export function fuzzyCompare(str1: string, str2: string, fuzz: string) {
    return str1 === str2 || str1 === str2 + fuzz || str1 + fuzz === str2;
}

export function compareIngredients(a: Ingredient, b: Ingredient): boolean {
    let str1 = a.name.replace(' ', '').toLowerCase();
    let str2 = b.name.replace(' ', '').toLowerCase();
    return fuzzyCompare(str1, str2, 's') || fuzzyCompare(str1, str2, 'es') || fuzzyCompare(str1, str2, 'cooked');
}

export function simpleAjaxCall<T>(url: string) : Promise<T> {
    return ajax({
        url,
        method: 'GET',
        context: document.body
    }) as any;
}