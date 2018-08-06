// tslint:disable:no-console
import * as React from "react";
import { Container } from "react-bootstrap/lib/Tab";
import { Grid, Row, Col, Panel, Modal, Button, Popover, OverlayTrigger, MenuItem, Clearfix } from "react-bootstrap";
import { FaPlus, FaTrash, FaEllipsisV, FaShoppingCart, FaFolder, FaPencil } from "react-icons/lib/fa"
// FaTrash, FaPencil,
import { IIngredientRepo, IRecipeRepo } from "../FoodApp";
import { Ingredient } from "../models/ingredient";
import { IngredientEditView } from "./ingredienteditview";

// NOTE: mode should be 'editing' 'deleting' or 'choosingEdit'
export class InventoryView extends React.Component<{ repo: IIngredientRepo & IRecipeRepo }, { editIngredient: Ingredient, mode: string }> {

    constructor(props: { repo: IIngredientRepo & IRecipeRepo }) {
        super(props);
        this.state = { editIngredient: new Ingredient(), mode: "" };

        this.renderShoppingRow = this.renderShoppingRow.bind(this);
        this.showTransferButtons = this.showTransferButtons.bind(this);
        this.renderArchiveRow = this.renderArchiveRow.bind(this);
        this.renderDeleteButton = this.renderDeleteButton.bind(this);
        this.renderEditButton = this.renderEditButton.bind(this);
        this.renderInventoryRow = this.renderInventoryRow.bind(this);
        this.editIngredient = this.editIngredient.bind(this);

    }

    private showTransferButtons = () => this.state.mode === "" || this.state.mode === 'editing';

    private editIngredient(ingredient: Ingredient) {
        this.setState({ editIngredient: ingredient, mode: "editing" });
    }

    private renderShoppingRow(ingredient: Ingredient) {
        return (<Row key={ingredient._id}>
            <span className="btn btn-block btn-secondary">
                {this.showTransferButtons() && <Button style={{ marginTop: '0px', marginLeft: '2px' }}
                    bsSize='xsmall'
                    onClick={() => {
                        this.props.repo.purchaseIngredient(ingredient)
                    }}
                    className="pull-left btn-circle classy-btn">
                    <FaPlus size={10} />
                </Button>}
                {this.renderDeleteButton(ingredient)}
                {this.renderEditButton(ingredient)}
                {ingredient.name}


                {this.showTransferButtons() && <Button style={{ marginTop: '0px', marginRight: '2px' }}
                    bsSize='xsmall'
                    onClick={() => {
                        this.props.repo.archiveIngredient(ingredient)
                    }}
                    className="pull-right btn-circle classy-btn">
                    <FaFolder size={10} />
                </Button>}
            </span>
        </Row>)
    }

    private renderArchiveRow(ingredient: Ingredient) {
        return (<Row key={ingredient._id}>
            <span className="btn btn-block btn-secondary">

                {this.showTransferButtons() && <Button style={{ marginTop: '0px', marginLeft: '2px' }}
                    bsSize='xsmall'
                    onClick={() => {
                        this.props.repo.useUpIngredient(ingredient)
                    }}
                    className="pull-left btn-circle classy-btn">
                    <FaShoppingCart size={10} />
                </Button>}

                {ingredient.name}
                {this.renderDeleteButton(ingredient)}
                {this.renderEditButton(ingredient)}
            </span>
        </Row>)
    }

    private renderDeleteButton(ingredient: Ingredient) {
        return (
            this.state.mode === 'deleting' && <Button style={{ marginTop: '0px', marginRight: '2px' }}
                bsSize='xsmall'
                onClick={() => {
                    this.props.repo.deleteIngredient(ingredient)
                }}
                className="pull-right btn-circle classy-btn">
                <FaTrash size={10} />
            </Button>
        )
    }

    private renderEditButton(ingredient: Ingredient) {
        return (
            this.state.mode === 'choosingEdit' && <Button style={{ marginTop: '0px', marginRight: '2px' }}
                bsSize='xsmall'
                onClick={() => {
                    this.editIngredient(ingredient)
                }}
                className="pull-right btn-circle classy-btn">
                <FaPencil size={10} />
            </Button>
        )
    }

    private renderInventoryRow(ingredient: Ingredient) {
        return (<Row key={ingredient._id}>
            <span className="btn btn-block btn-secondary">

                {ingredient.name}
                {this.renderDeleteButton(ingredient)}
                {this.renderEditButton(ingredient)}
                {this.showTransferButtons() && <Button style={{ marginTop: '0px', marginRight: '2px' }}
                    bsSize='xsmall'
                    onClick={() => {
                        this.props.repo.useUpIngredient(ingredient)
                    }}
                    className="pull-right btn-circle classy-btn">
                    <FaShoppingCart size={10} />
                </Button>}
            </span>
        </Row>)
    }

    private contextMenu = (
        <Popover id="popover-positioned-right" title="Options" style={{ padding: 0 }}>
            <Clearfix>
                <ul style={{ padding: 0 }}>
                    <MenuItem eventKey="1" onClick={() => {
                        let ingredient = new Ingredient();
                        ingredient.status = 'inventory';
                        this.setState({ editIngredient: ingredient, mode: "editing" });
                        document.body.click(); // HACK ALERT! This manually closes the popover after the user has selected an option
                    }}>Add</MenuItem>
                    <MenuItem eventKey="2" onClick={() => {
                        this.setState({ mode: "choosingEdit" });
                        document.body.click(); // HACK ALERT! This manually closes the popover after the user has selected an option
                    }}>Edit</MenuItem>
                    <MenuItem eventKey="2" onClick={() => {
                        this.setState({ mode: "deleting" });
                        document.body.click(); // HACK ALERT! This manually closes the popover after the user has selected an option
                    }}>Delete</MenuItem>
                </ul>
            </Clearfix>
        </Popover>)

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
                    <Modal show={this.state.mode === "editing"} onHide={() => this.setState({ mode: "" })}>
                        <Modal.Header>
                            <Modal.Title className="text-center">Add Item</Modal.Title>
                        </Modal.Header>
                        <Modal.Body>
                            <Row>
                                <Col sm={12} id='new_ingredient'>
                                    <IngredientEditView
                                        ingredient={this.state.editIngredient}
                                        repo={this.props.repo}
                                        onSave={() => { this.setState({ mode: "" }) }} />
                                </Col>
                            </Row>
                        </Modal.Body>
                    </Modal>
                    <Row>
                        <Col sm={4}>
                            <Panel>
                                <Panel.Heading>

                                    <OverlayTrigger rootClose={true} trigger="click" placement="right" overlay={this.contextMenu}>
                                        <Button style={{ marginTop: '3px', marginLeft: '0px', marginRight: '15px' }}
                                            bsSize='small'
                                            className="pull-right btn-circle classy-btn">
                                            <FaEllipsisV size={15} />
                                        </Button>
                                    </OverlayTrigger>
                                    <h4>Inventory</h4>
                                </Panel.Heading>
                                <Panel.Body>
                                    <div className="vertical-bar">
                                        Test123
                                    </div>
                                    <div className="ingredient-block">
                                        {inventoryRows}
                                    </div>
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
                                            this.setState({ editIngredient: ingredient, mode: "editing" })
                                        }}
                                        className="pull-right btn-circle classy-btn">
                                        <FaShoppingCart size={15} />
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
                                            this.setState({ editIngredient: ingredient, mode: "editing" })
                                        }}
                                        className="pull-right btn-circle classy-btn">
                                        <FaFolder size={15} />
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