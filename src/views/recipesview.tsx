// tslint:disable:no-console
import * as React from "react";
import { Container } from "react-bootstrap/lib/Tab";
import { Grid, Row, Col, Panel, Button, Modal } from "react-bootstrap";
import { Recipe } from "../models/recipe";
import { Material } from "../models/material";
import { RecipeEditView } from "./recipeeditview";
import { FaTimesCircle, FaPencil } from "react-icons/lib/fa"
import { IRecipeRepo } from "../FoodApp";

export class RecipesView extends React.Component<{ repo: IRecipeRepo }, { editing: boolean, editRecipe: Recipe }> {

    constructor(props: { repo: IRecipeRepo }) {
        super(props);
        this.state = { editing: false, editRecipe: new Recipe() };
    }

    public render() {
        let rows = [] as JSX.Element[];
        if (this.props.repo.state.recipes) {
            rows = this.props.repo.state.recipes.map((recipe: Recipe) => {
                let materials = recipe.materials.map((material: Material, index: number) => {
                    return (
                        <li className="list-group-item" key={index} >
                            <span>
                                {material.print()}
                            </span>
                        </li>
                    );
                });
                return (
                    <Row className="recipe-row" key={recipe._id}>
                        <Panel defaultExpanded={false} className='no-border'>
                            <Panel.Toggle componentClass="a" className="no-border btn btn-block btn-secondary">
                                <FaPencil className="pull-left" onClick={() => { this.setState({ editRecipe: recipe, editing: true }) }} />
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
                                        onSave={() => { this.setState({ editing: false }) }} />
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
                                    TODO
                                            </Panel.Body>
                            </Panel>
                        </Col>
                        <Col sm={6}>
                            <Panel>
                                <Panel.Heading>
                                    <Button bsSize='small' bsStyle="success" className="pull-right icon-btn glyphicon btn-glyphicon glyphicon-plus img-circle text-success"
                                        onClick={() => this.setState({ editing: true })}>+
                                                </Button>
                                    <h4>All Recipes</h4>
                                </Panel.Heading>
                                <Panel.Body>
                                    {rows}
                                </Panel.Body>
                            </Panel>
                        </Col>
                    </Row>
                </Grid>
            </Container>
        );
    }
}