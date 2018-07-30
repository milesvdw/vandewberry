// tslint:disable:no-console
import * as React from "react";
import { Container } from "react-bootstrap/lib/Tab";
import { Grid, Row, Col, Panel, Modal, Button } from "react-bootstrap";
import { Recipe } from "../models/recipe";
import { Material } from "../models/material";
import { RecipeEditView } from "./recipeeditview";
import { FaPencil, FaPlus, FaSearch, FaShoppingCart} from "react-icons/lib/fa"
import { IRecipeRepo, IIngredientRepo } from "../FoodApp";
import { Ingredient } from "../models/ingredient";
import { compareIngredients } from "../utils/utils";

export class RecipesView extends React.Component<{ repo: IIngredientRepo & IRecipeRepo }, { editing: boolean, editRecipe: Recipe, searchQuery: string }> {

    constructor(props: { repo: IIngredientRepo & IRecipeRepo }) {
        super(props);
        this.state = { editing: false, editRecipe: new Recipe(), searchQuery: "" };

        this.displayMaterials = this.displayMaterials.bind(this);
        this.getAllRecipes = this.getAllRecipes.bind(this);
        this.getAvailableRecipes = this.getAvailableRecipes.bind(this);
        this.mapRecipesToRows = this.mapRecipesToRows.bind(this);
        this.getAllSearchedRecipes = this.getAllSearchedRecipes.bind(this);
        this.searchRecipes = this.searchRecipes.bind(this);
        this.addIngredientsToCart = this.addIngredientsToCart.bind(this);
    }

    private searchInput: any;

    private displayMaterials(materials: Material[]) {
        let inventory = this.props.repo.state.ingredients.filter((i: Ingredient) => i.status === 'inventory');
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

        let inventoryOrShopping = this.props.repo.state.ingredients.filter((i: Ingredient) => i.status !== 'archived');
        let archivedIngredients = this.props.repo.state.ingredients.filter((i: Ingredient) => i.status === 'archived');

        let neededMaterials = materials.filter((m: Material) => !m.isAvailable(inventoryOrShopping));

        neededMaterials.forEach((m: Material) => {
            // if the material can be fullfilled by an existing ingredient, we'll use that.
            // oh btw we know that we only have to look in the archive to find those, because
            // it wasn't in inventory or shopping
            let firstExistingMatch = archivedIngredients.find((ai: Ingredient) => m.ingredients.some((i: Ingredient) => compareIngredients(i, ai)));

            if(firstExistingMatch) {
                firstExistingMatch.status = 'shopping';
                this.props.repo.saveIngredient(firstExistingMatch);
            } else {
                let ingredient = new Ingredient(m.ingredients[0]);
                ingredient._id = undefined;
                ingredient.status = 'shopping';
                this.props.repo.saveIngredient(ingredient);
            }
        });
    }

    private mapRecipesToRows(recipes: Recipe[]) {
        return recipes
            .sort((recipe1: Recipe, recipe2: Recipe) => {
                return recipe1.name.localeCompare(recipe2.name);
            })
            .map((recipe: Recipe) => {

                let materials = this.displayMaterials(recipe.materials);

                return (
                    <Row className="recipe-row" key={recipe._id}>
                        <Panel defaultExpanded={false} className='no-border'>
                            <Panel.Toggle componentClass="a" className="no-border btn btn-block btn-secondary">
                                <FaPencil
                                    className="pull-left"
                                    onClick={(e: any) => {
                                        e.stopPropagation();
                                        this.setState({ editRecipe: recipe, editing: true })
                                    }} />
                                {/* <a className="pull-left glyphicon glyphicon-pencil glyph-button" data-bind="click: function() {edit_recipe($data.id)}" data-target="#add_recipe_modal"
                                data-toggle="modal"></a> */}
                                <FaShoppingCart
                                    className="pull-right"
                                    onClick={() => {this.addIngredientsToCart(recipe.materials)}}
                                />
                                {recipe.name}
                            </Panel.Toggle>
                            <Panel.Collapse>
                                <div id={'possible_recipe_details_' + recipe._id}>
                                    <ul className="list-group well">
                                        <li className="list-group-item list-group-item-info">
                                            {recipe.description}
                                        </li>
                                        {materials}
                                        <button className="btn-row" onClick={() => { if(confirm('Delete the item?')) {this.props.repo.deleteRecipe(recipe)} }}>
                                            DELETE
                                        </button>
                                    </ul>
                                </div>
                            </Panel.Collapse>
                        </Panel>
                    </Row>
                );
            });
    }

    private getAvailableRecipes() {
        let availableRecipes = this.props.repo.state.recipes
            .filter((recipe: Recipe) => {

                let missingMaterials = recipe.materials
                    .filter((material: Material) => {
                        return material.required && !material.isAvailable(this.props.repo.state.ingredients);
                    });

                return !(missingMaterials.length > 0);
            });

        return this.mapRecipesToRows(availableRecipes);
    }

    private getAllSearchedRecipes() {
        if (this.state.searchQuery.length > 0) {
            return this.props.repo.state.recipes
                .filter((recipe: Recipe) => {
                    return recipe.name.toLowerCase().indexOf(this.state.searchQuery.toLowerCase()) >= 0;
                });
        } else {
            return this.props.repo.state.recipes;
        }
    }

    private getAllRecipes() {
        return this.mapRecipesToRows(this.getAllSearchedRecipes());
    }

    private searchRecipes(event: any) {
        this.setState({ searchQuery: event.target.value });
    }

    public render() {
        let allRecipes = [] as JSX.Element[];
        let availableRecipes = [] as JSX.Element[];

        if (this.props.repo.state.recipes) {
            allRecipes = this.getAllRecipes();
            availableRecipes = this.getAvailableRecipes();
        }

        return (
            <Container id='recipes_container'>
                <Grid>
                    <Modal show={this.state.editing} onHide={() => this.setState({ editing: false })}>
                        <Modal.Header>
                            <Modal.Title className="text-center">Create Recipe</Modal.Title>
                        </Modal.Header>
                        <Modal.Body>
                            <Row>
                                <Col sm={12} id='new_recipe'>
                                    <RecipeEditView
                                        recipe={this.state.editRecipe}
                                        repo={this.props.repo}
                                        onSave={() => {
                                            this.setState({ editing: false })
                                        }} />
                                </Col>
                            </Row>
                        </Modal.Body>
                    </Modal>
                    <Row>
                        <Col sm={6}>
                            <Panel>
                                <Panel.Heading>
                                    <h4>Current Possibilities</h4>
                                </Panel.Heading>
                                <Panel.Body>
                                    {availableRecipes}
                                </Panel.Body>
                            </Panel>
                        </Col>
                        <Col sm={6}>
                            <Panel>
                                <Panel.Heading>
                                    <Button style={{ marginTop: '3px' }}
                                        bsSize='small'
                                        onClick={() => {
                                            this.setState({ editRecipe: new Recipe(), editing: true });
                                        }}
                                        className="pull-right btn-circle classy-btn">
                                        <FaPlus size={15} />
                                    </Button>
                                    <Button style={{ marginTop: '3px' }}
                                        bsSize='small'
                                        onClick={() => {
                                            this.searchInput.focus();
                                        }}
                                        className="pull-right btn-circle classy-btn search-btn">

                                        <input placeholder="search" ref={(input) => { this.searchInput = input }} onChange={this.searchRecipes} />
                                        <FaSearch size={15} className="pull-right" style={{ marginRight: '7px' }} />
                                    </Button>
                                    <h4>All Recipes</h4>

                                </Panel.Heading>
                                <Panel.Body>
                                    {allRecipes}
                                </Panel.Body>
                            </Panel>
                        </Col>
                    </Row>
                </Grid>
            </Container>
        );
    }
}