// tslint:disable:no-console
import * as React from "react";
import { Container } from "react-bootstrap/lib/Tab";
import { Grid, Row, Col, Panel, Modal, Button } from "react-bootstrap";
import { Recipe } from "../models/recipe";
import { Material } from "../models/material";
import { RecipeEditView } from "./recipeeditview";
import { FaTimesCircle, FaPencil, FaPlus } from "react-icons/lib/fa"
import { IRecipeRepo, IIngredientRepo } from "../FoodApp";

export class RecipesView extends React.Component<{ repo: IIngredientRepo & IRecipeRepo }, { editing: boolean, editRecipe: Recipe }> {

    constructor(props: { repo: IIngredientRepo & IRecipeRepo }) {
        super(props);
        this.state = { editing: false, editRecipe: new Recipe() };

        this.getAllRecipes.bind(this);
        this.getAvailableRecipes.bind(this);
        this.mapRecipesToRows.bind(this);
    }

    private displayMaterials(materials: Material[]) {
        return materials
            .map((material: Material, index: number) => {

                let materialIsMissingMarker = "";
                let available = material.isAvailable(this.props.repo.state.ingredients);
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
                                {recipe.name}
                                <FaTimesCircle className="pull-right" onClick={() => { this.props.repo.deleteRecipe(recipe) }} />
                            </Panel.Toggle>
                            <Panel.Collapse>
                                <div id={'possible_recipe_details_' + recipe._id}>
                                    <ul className="list-group well">
                                        <li className="list-group-item list-group-item-info">
                                            {recipe.description}
                                        </li>
                                        {materials}
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

    private getAllRecipes() {
        return this.mapRecipesToRows(this.props.repo.state.recipes);
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
                                        bsStyle='success'
                                        bsSize='sm'
                                        onClick={() => {
                                            this.setState({ editRecipe: new Recipe(), editing: true });
                                        }}
                                        className="pull-right">
                                        <FaPlus size={20} />
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