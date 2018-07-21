// tslint:disable:no-console
import * as React from "react";
import { Container } from "react-bootstrap/lib/Tab";
import { Grid, Row, Col, Panel, Modal, Button } from "react-bootstrap";
import { FaPlus } from "react-icons/lib/fa"
import { IIngredientRepo } from "../FoodApp";
import { Ingredient } from "src/models/ingredient";

export class InventoryView extends React.Component<{ repo: IIngredientRepo }, { editing: boolean, editIngredient: Ingredient }> {

    constructor(props: { repo: IIngredientRepo }) {
        super(props);
        this.state = { editing: false, editIngredient: new Ingredient() };
    }

    public render() {
        let rows = [] as JSX.Element[];
        return (
            <Container id='recipes_container'>
                <Grid>
                    <Modal show={this.state.editing} onHide={() => this.setState({ editing: false })}>
                        <Modal.Header>
                            <Modal.Title className="text-center">Create Recipe</Modal.Title>
                        </Modal.Header>
                        <Modal.Body>
                            <Row>
                                <Col sm={12} id='new_ingredient'>
                                    {/* <IngredientEditView
                                        recipe={this.state.editIngredient}
                                        repo={this.props.repo}
                                        onSave={() => { this.setState({ editing: false }) }} /> */}
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
                                    <Button style={{marginTop: '3px'}} bsStyle='success' bsSize='sm' onClick={() => this.setState({ editIngredient: new Ingredient(), editing: true })} className="pull-right">
                                        <FaPlus size={20} />
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