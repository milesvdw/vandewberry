export class IngredientGroup {
    public id?: number;
    public name: string;
    
    public constructor(init?: Partial<IngredientGroup>) {
        Object.assign(this, init);
    }
}