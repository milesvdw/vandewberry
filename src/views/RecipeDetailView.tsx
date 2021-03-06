// tslint:disable:no-console
import * as React from "react";

import Row from "react-bootstrap/lib/Row";
import Panel from "react-bootstrap/lib/Panel";
import * as Utils from "../utils/utils";

import { Recipe } from "../models/recipe";
import { Material } from "../models/material";

import FaTimesCircle from "react-icons/lib/fa/times-circle";
import FaPencil from "react-icons/lib/fa/pencil";
import FaShoppingCart from "react-icons/lib/fa/shopping-cart";
import FaShareAlt from "react-icons/lib/fa/share-alt";

import { IRecipeRepo, IIngredientRepo } from "../FoodApp";
import { Ingredient, STATUS } from "../models/ingredient";
import { compareIngredients } from "../utils/utils";
import {  toast } from 'react-toastify';

export class RecipeDetailView extends React.Component<{ repo: IIngredientRepo & IRecipeRepo, editRecipe: (recipe: Recipe) => void, shareRecipe: (recipe: Recipe) => void, recipe: Recipe }> {

    public constructor(props: { repo: IIngredientRepo & IRecipeRepo, editRecipe: (recipe: Recipe) => void, shareRecipe: (recipe: Recipe) => void, recipe: Recipe }) {
        super(props);

        this.displayMaterials = this.displayMaterials.bind(this);
        this.displayRecipeButtons = this.displayRecipeButtons.bind(this);
        this.addIngredientsToCart = this.addIngredientsToCart.bind(this);
    }

    private displayMaterials(materials: Material[]) {
        let inventory = this.props.repo.state.ingredients.filter((i: Ingredient) => i.statusID === STATUS.INVENTORY);
        return materials
            .map((material: Material, index: number) => {

                let materialIsMissingMarker = "";
                let available = material.isAvailable(inventory);
                if (material.required && !available) {
                    materialIsMissingMarker = "list-group-item-danger"
                } else if (!material.required && !available) {
                    materialIsMissingMarker = "list-group-item-warning"
                }

                return (
                    <li className={"list-group-item " + materialIsMissingMarker} key={index} >
                        <span>
                            {material.print()}
                        </span>
                    </li>
                );
            });
    }

    private addIngredientsToCart(materials: Material[]) {
        // 1. Filter list of materials to those which are made exclusively of ingredients not in the inventory
        // 2. Add the first ingredient of each of those to the shopping list
        // Moving an existing ingredient if possible
        // Creating an ingredient if not possible

        // For each material:
        //   find the subset of the material's ingredients have an existing archived match in the database
        //   grab the first of these, 

        let inventoryIngredients = this.props.repo.state.ingredients.filter((i: Ingredient) => i.statusID === STATUS.SHOPPING)
        let inventoryOrShopping = this.props.repo.state.ingredients.filter((i: Ingredient) => i.statusID !== STATUS.ARCHIVED);
        let archivedIngredients = this.props.repo.state.ingredients.filter((i: Ingredient) => i.statusID === STATUS.ARCHIVED);

        let updatedRequiredMaterials = materials.filter((m: Material) => m.isAvailable(inventoryIngredients))

        let neededMaterials = materials.filter((m: Material) => !m.isAvailable(inventoryOrShopping));

        neededMaterials.forEach((m: Material) => {
            // if the material can be fullfilled by an existing ingredient, we'll use that.
            // oh btw we know that we only have to look in the archive to find those, because
            // it wasn't in inventory or shopping
            let firstExistingMatch = archivedIngredients.find((ai: Ingredient) => m.ingredientgroups.some((i: Ingredient) => compareIngredients(i, ai)));

            if (firstExistingMatch) {
                firstExistingMatch.statusID = STATUS.SHOPPING;
                firstExistingMatch.shoppingQuantity = m.quantity;
                this.props.repo.saveIngredient(firstExistingMatch);
            } else {
                let ingredient = new Ingredient();
                ingredient.name = m.ingredientgroups[0].name; // TODO we need to separate the Ingredients from IngredientGroups in a meaningful way
                ingredient.id = undefined;
                ingredient.statusID = STATUS.SHOPPING;
                ingredient.shoppingQuantity = m.quantity;
                ingredient.householdId = this.props.repo.state.ingredients[0].householdId;
                this.props.repo.saveIngredient(ingredient);
            }
        });

        updatedRequiredMaterials.forEach((m: Material) => {
            let match = inventoryIngredients.find((si: Ingredient) => m.ingredientgroups.some((i: Ingredient) => compareIngredients(i, si))) || new Ingredient(); // This is always guaranteed to find a match
            
            let newQuantity = RecipeDetailView.combineQuantitiesIfPossible(match.shoppingQuantity, m.quantity); 
            if(match.shoppingQuantity !== newQuantity) {
                match.shoppingQuantity = newQuantity;
                this.props.repo.saveIngredient(match);
            }
        });
    }

    private static combineQuantitiesIfPossible(q1: string, q2: string) { // TODO: this util function probably belongs somewhere else
        let q1Number = parseInt(q1, 10);
        let q2Number = parseInt(q2, 10);
        
        if(q1Number && q2Number) {
            // both quantities were numbers, so let's see if the rest of the strings match, give or take an 's'
            let q1Sub = q1.substr(q1Number.toString().length);
            let q2Sub = q2.substr(q2Number.toString().length);
            if(Utils.compareIngredientNames(q1Sub, q2Sub)) {
                return q1Number + q2Number + q1Sub;
            }
        } else {
            if(!Utils.compareIngredientNames(q1, q2)) {
                if(q1 === "") {
                    return q2;
                }
                else if(q2 === "")  {
                    return q1;
                }
                else {
                    return q1 + " and " + q2;
                }
            }
        }
        return q1;
    }

    private displayRecipeButtons(recipe: Recipe) {

        return (
            <li className="button-container">
                <button className='btn-row'
                    onClick={(e: any) => {
                        e.stopPropagation();
                        this.props.editRecipe(this.props.recipe);
                    }}>
                    <FaPencil />
                </button>
                <button className='btn-row'
                    onClick={() => { 
                        this.addIngredientsToCart(recipe.materials) 
                        toast.success('Missing recipe items added to shopping cart.')
                    }}>
                    <FaShoppingCart />
                </button>
                <button className='btn-row'
                    onClick={() => {
                        this.props.shareRecipe(recipe)
                    }}>
                    <FaShareAlt />
                </button>
                <button className='btn-row'
                    onClick={() => {
                        if (confirm('Delete this recipe?')) { this.props.repo.deleteRecipe(recipe) }
                        toast.success(recipe.name.capitalize() + ' deleted.')
                    }}>
                    <FaTimesCircle />
                </button>
            </li>
        )
    }

    public render() {
        let materials = this.displayMaterials(this.props.recipe.materials);
        let recipeButtons = this.displayRecipeButtons(this.props.recipe);
        return (
            <Row className="recipe-row" key={this.props.recipe.id}>
                <Panel defaultExpanded={false} className='no-border'>
                    <Panel.Toggle componentClass="a" className="no-border btn btn-block btn-secondary">
                        {this.props.recipe.name.capitalize()}
                    </Panel.Toggle>
                    <Panel.Collapse>
                        <div id={'possible_recipe_details_' + this.props.recipe.id}>
                            <ul className="list-group well">

                                {recipeButtons}
                                <li className="list-group-item" style={{ textAlign: 'center' }}>
                                    Calories: {this.props.recipe.calories}
                                </li>
                                <li className="list-group-item" style={{ textAlign: 'center' }}>
                                    <button
                                        className="classy-btn no-outline btn-round btn-press btn-default"
                                        onClick={() => {
                                            this.props.recipe.lastEaten = new Date(Date.now());
                                            this.props.repo.saveRecipe(this.props.recipe);
                                        }}>
                                        Last Eaten: {this.props.recipe.lastEatenString()}
                                    </button>
                                </li>
                                {materials}
                                <li className="list-group-item list-group-item-info">
                                    {this.props.recipe.description}
                                </li>
                            </ul>
                        </div>
                    </Panel.Collapse>
                </Panel>
            </Row>
        );
    }
}