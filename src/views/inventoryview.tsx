// tslint:disable:no-console
import * as React from "react";
import { Container } from "react-bootstrap/lib/Tab";
import { Grid, Row, Col, Panel, Modal, Button } from "react-bootstrap";
import { FaPlus, FaShoppingCart, FaFolder } from "react-icons/lib/fa"
import { IIngredientRepo, IRecipeRepo } from "../FoodApp";
import { Ingredient } from "src/models/ingredient";
import { IngredientEditView } from "src/views/ingredienteditview";

export class InventoryView extends React.Component<{ repo: IIngredientRepo & IRecipeRepo }, { editing: boolean, editIngredient: Ingredient }> {

    constructor(props: { repo: IIngredientRepo & IRecipeRepo }) {
        super(props);
        this.state = { editing: false, editIngredient: new Ingredient() };

        this.renderShoppingRow = this.renderShoppingRow.bind(this);
    }

    private renderShoppingRow(ingredient: Ingredient) {
        return (<Row key={ingredient._id}>
            <span className="btn btn-block btn-secondary">
                <Button style={{ marginTop: '3px', marginLeft: '2px' }}
                    bsSize='small'
                    onClick={() => {
                        this.props.repo.purchaseIngredient(ingredient)
                    }}
                    className="pull-left btn-circle classy-btn">
                    <FaPlus size={15} />
                </Button>
                {ingredient.name}


                <Button style={{ marginTop: '3px', marginRight: '2px' }}
                    bsSize='small'
                    onClick={() => {
                        this.props.repo.archiveIngredient(ingredient)
                    }}
                    className="pull-right btn-circle classy-btn">
                    <FaFolder size={15} />
                </Button>
            </span>
        </Row>)
    }

    private renderArchiveRow(ingredient: Ingredient) {
        return (<Row key={ingredient._id}>
            <span className="btn btn-block btn-secondary">

                <Button style={{ marginTop: '3px', marginLeft: '2px' }}
                    bsSize='small'
                    onClick={() => {
                        this.props.repo.useUpIngredient(ingredient)
                    }}
                    className="pull-left btn-circle classy-btn">
                    <FaShoppingCart size={15} />
                </Button>
                {ingredient.name}
            </span>
        </Row>)
    }

    private renderInventoryRow(ingredient: Ingredient) {
        return (<Row key={ingredient._id}>
            <span className="btn btn-block btn-secondary">
                {ingredient.name}

                <Button style={{ marginTop: '3px', marginRight: '2px' }}
                    bsSize='small'
                    onClick={() => {
                        this.props.repo.useUpIngredient(ingredient)
                    }}
                    className="pull-right btn-circle classy-btn">
                    <FaShoppingCart size={15} />
                </Button>
            </span>
        </Row>)
    }

    public render() {

        let archivedRows = this.props.repo.state.ingredients
            .filter((ingredient: Ingredient) => ingredient.status === 'archived')
            .map((ingredient) => this.renderArchiveRow(ingredient));

        let shoppingRows = this.props.repo.state.ingredients
            .filter((ingredient: Ingredient) => ingredient.status === 'shopping')
            .map((ingredient) => this.renderShoppingRow(ingredient));

        let inventoryRows = this.props.repo.state.ingredients
            .filter((ingredient: Ingredient) => ingredient.status === 'inventory')
            .map((ingredient) => this.renderInventoryRow(ingredient));


        return (
            <Container id='ingredient_container'>
                <Grid>
                    <Modal show={this.state.editing} onHide={() => this.setState({ editing: false })}>
                        <Modal.Header>
                            <Modal.Title className="text-center">Add Item</Modal.Title>
                        </Modal.Header>
                        <Modal.Body>
                            <Row>
                                <Col sm={12} id='new_ingredient'>
                                    <IngredientEditView
                                        ingredient={this.state.editIngredient}
                                        repo={this.props.repo}
                                        onSave={() => { this.setState({ editing: false }) }} />
                                </Col>
                            </Row>
                        </Modal.Body>
                    </Modal>
                    <Row>
                        <Col sm={4}>
                            <Panel>
                                <Panel.Heading>
                                    <Button style={{ marginTop: '3px' }}
                                        bsSize='small'
                                        onClick={() => {
                                            let ingredient = new Ingredient();
                                            ingredient.status = 'inventory';
                                            this.setState({ editIngredient: ingredient, editing: true })
                                        }}
                                        className="pull-right btn-circle classy-btn">
                                        <FaPlus size={15} />
                                    </Button>
                                    <h4>Inventory</h4>
                                </Panel.Heading>
                                <Panel.Body>
                                    {inventoryRows}
                                </Panel.Body>
                            </Panel>
                        </Col>
                        <Col sm={4}>
                            <Panel>
                                <Panel.Heading>
                                    <Button style={{ marginTop: '3px' }}
                                        bsSize='small'
                                        onClick={() => {
                                            let ingredient = new Ingredient();
                                            ingredient.status = 'shopping';
                                            this.setState({ editIngredient: ingredient, editing: true })
                                        }}
                                        className="pull-right btn-circle classy-btn">
                                        <FaPlus size={15} />
                                    </Button>
                                    <h4>Shopping List</h4>

                                </Panel.Heading>
                                <Panel.Body>
                                    {shoppingRows}
                                </Panel.Body>
                            </Panel>
                        </Col>
                        <Col sm={4}>
                            <Panel>
                                <Panel.Heading>
                                    <Button style={{ marginTop: '3px' }}
                                        bsSize='small'
                                        onClick={() => {
                                            let ingredient = new Ingredient();
                                            ingredient.status = 'archived';
                                            this.setState({ editIngredient: ingredient, editing: true })
                                        }}
                                        className="pull-right btn-circle classy-btn">
                                        <FaPlus size={15} />
                                    </Button>
                                    <h4>Archived</h4>

                                </Panel.Heading>
                                <Panel.Body>
                                    {archivedRows}
                                </Panel.Body>
                            </Panel>
                        </Col>
                    </Row>
                </Grid>
            </Container>
        );
    }
}