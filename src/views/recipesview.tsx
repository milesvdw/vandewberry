// tslint:disable:no-console
import * as React from "react";
import { Container } from "react-bootstrap/lib/Tab";

import Grid from "react-bootstrap/lib/Grid";
import Row from "react-bootstrap/lib/Row";
import Col from "react-bootstrap/lib/Col";
import Panel from "react-bootstrap/lib/Panel";
import Modal from "react-bootstrap/lib/Modal";
import Button from "react-bootstrap/lib/Button";

import { Recipe } from "../models/recipe";
import { Material } from "../models/material";
import { RecipeEditView } from "./recipeeditview";

import FaPlus from "react-icons/lib/fa/plus";
import FaSearch from "react-icons/lib/fa/search";
import { IRecipeRepo, IIngredientRepo } from "../FoodApp";
import { Ingredient, STATUS } from "../models/ingredient";
import { RecipeDetailView } from "./RecipeDetailView";
import { toast } from "react-toastify"

export class RecipesView extends React.Component<{ repo: IIngredientRepo & IRecipeRepo }, { sharing: boolean, editing: boolean, editRecipe: Recipe, shareHousehold: string, searchQuery: string, currentSearchQuery: string }> {

    constructor(props: { repo: IIngredientRepo & IRecipeRepo }) {
        super(props);
        this.state = { sharing: false, editing: false, shareHousehold: "", editRecipe: new Recipe(), searchQuery: "", currentSearchQuery: "" };
        this.getAllRecipes = this.getAllRecipes.bind(this);
        this.getAvailableRecipes = this.getAvailableRecipes.bind(this);
        this.mapRecipesToRows = this.mapRecipesToRows.bind(this);
        this.getAllSearchedRecipes = this.getAllSearchedRecipes.bind(this);
        this.searchRecipes = this.searchRecipes.bind(this);
        this.searchCurrentRecipes = this.searchCurrentRecipes.bind(this);
        this.shareRecipe = this.shareRecipe.bind(this);
        this.editRecipe = this.editRecipe.bind(this);
        this.updateShareHousehold = this.updateShareHousehold.bind(this);
    }

    private currentSearchInput: any;

    private searchInput: any;

    private editRecipe(recipe: Recipe) {
        this.setState({ editRecipe: recipe, editing: true })
    }
    private shareRecipe(recipe: Recipe) {
        this.setState({ editRecipe: recipe, sharing: true })
    }

    private updateShareHousehold(event: any) {
        let shareHousehold: string = event.target.value as string;
        return this.setState({ shareHousehold });
    }

    private mapRecipesToRows(recipes: Recipe[]) {
        return recipes
            .sort((recipe1: Recipe, recipe2: Recipe) => {
                return recipe1.name.localeCompare(recipe2.name);
            })
            .map((recipe: Recipe) => {
                return <RecipeDetailView key={recipe.id} repo={this.props.repo} recipe={recipe} shareRecipe={this.shareRecipe} editRecipe={this.editRecipe} />
            });
    }

    private getAvailableRecipes() {
        let availableRecipes = this.props.repo.state.recipes
            .filter((recipe: Recipe) => {

                let missingMaterials = recipe.materials
                    .filter((material: Material) => {
                        let available = material.isAvailable(this.props.repo.state.ingredients.filter((ingredient: Ingredient) => {
                            return ingredient.statusID === STATUS.INVENTORY;
                        }));
                        return material.required && !available;
                    });

                return missingMaterials.length === 0;
            });

        return this.mapRecipesToRows(this.getAllSearchedRecipes(this.state.currentSearchQuery, availableRecipes));
    }

    private getAllSearchedRecipes(input: string, recipes: Recipe[]) {
        if (input.length > 0) {
            return recipes
                .filter((recipe: Recipe) => {
                    return recipe.name.toLowerCase().indexOf(input.toLowerCase()) >= 0;
                });
        } else {
            return recipes;
        }
    }

    private getAllRecipes() {
        return this.mapRecipesToRows(this.getAllSearchedRecipes(this.state.searchQuery, this.props.repo.state.recipes));
    }

    private searchRecipes(event: any) {
        this.setState({ searchQuery: event.target.value });
    }

    private searchCurrentRecipes(event: any) {
        this.setState({ currentSearchQuery: event.target.value });
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
                    <Modal show={this.state.sharing} onHide={() => this.setState({ sharing: false })}>
                        <Modal.Header>
                            <Modal.Title className="text-center">Share Recipe</Modal.Title>
                        </Modal.Header>
                        <Modal.Body>
                            <Row>
                                <div style={{paddingLeft: '15px', paddingBottom: '15px'}}>
                                    Enter the household name of the individual you wish to share a recipe with.
                                </div>
                            </Row>
                            <Row>
                                <Col sm={6} id='new_recipe'>
                                    <input type='text' name='shareHousehold' className='form-control' value={this.state.shareHousehold} onChange={this.updateShareHousehold} />

                                </Col>
                                <Col sm={6}>
                                    <Button bsSize='large' bsStyle='info' className='pull-right'
                                        onClick={() => {
                                            this.props.repo.shareRecipe(this.state.editRecipe, this.state.shareHousehold);
                                            this.setState({ sharing: false })
                                            toast.success('Recipe shared.')
                                        }}> Save</Button>
                                </Col>
                            </Row>
                        </Modal.Body>
                    </Modal>
                    <Row>
                        <Col sm={6}>
                            <Panel>
                                <Panel.Heading>
                                    <Button style={{ marginTop: '3px' }}
                                        bsSize='small'
                                        onClick={() => {
                                            this.currentSearchInput.focus();
                                        }}
                                        className={"pull-right btn-circle classy-btn search-btn" + ((this.state.currentSearchQuery.length > 0) ? " search-btn-open" : "")}>

                                        <input placeholder="search" ref={(input) => { this.currentSearchInput = input }} onChange={this.searchCurrentRecipes} />
                                        <FaSearch size={15} className="pull-right" style={{ marginRight: '7px' }} />
                                    </Button>
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
                                        className={"pull-right btn-circle classy-btn search-btn" + ((this.state.searchQuery.length > 0) ? " search-btn-open" : "")}>

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