import { Ingredient } from "../models/ingredient";
import { IngredientGroup } from "../models/IngredientGroup";

export function fuzzyCompare(str1: string, str2: string, fuzz: string) {
    return str1 === str2 || str1 === str2 + fuzz || str1 + fuzz === str2;
}

export function compareIngredients(a: Ingredient | IngredientGroup, b: Ingredient | IngredientGroup): boolean {
    let str1 = a.name.replace(' ', '').toLowerCase();
    let str2 = b.name.replace(' ', '').toLowerCase();
    return fuzzyCompare(str1, str2, 's') || fuzzyCompare(str1, str2, 'es') || fuzzyCompare(str1, str2, 'cooked');
}

// Array.prototype.contains = function (v) {
//     for (var i = 0; i < this.length; i++) {
//         if (this[i] === v) return true;
//     }
//     return false;
// };

declare global {
    // tslint:disable-next-line:interface-name
    interface Array<T> {
        unique(): T[];
    }
    // tslint:disable-next-line:interface-name
    interface String {
        capitalize(): string;
    }
}

Array.prototype.unique = function <T>(): T[] {
    return this.filter((value: any, index: number) => this.indexOf(value) === index);
}



String.prototype.capitalize = function () {
    return this.replace(/(\b)+\w/g,
        (txt) =>  { 
            return txt.charAt(0).toUpperCase() + txt.substr(1).toLowerCase();});
}