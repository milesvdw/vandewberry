// tslint:disable:no-console
import * as React from "react";
import { Container } from "react-bootstrap/lib/Tab";
import { Grid, Row, Col, Panel, Modal, Button, Popover, OverlayTrigger, MenuItem, Clearfix } from "react-bootstrap";
import { FaPlus, FaTrash, FaEllipsisV, FaShoppingCart, FaFolder, FaPencil, FaSearch } from "react-icons/lib/fa"
// FaTrash, FaPencil,
import { IIngredientRepo, IRecipeRepo } from "../FoodApp";
import { Ingredient } from "../models/ingredient";
import { IngredientEditView } from "./ingredienteditview";

// NOTE: mode should be 'editing' 'deleting' or 'choosingEdit'
export class InventoryView extends React.Component<{ repo: IIngredientRepo & IRecipeRepo }, { editIngredient: Ingredient, mode: string, groupByCategory: boolean, searchQuery: string }> {

    constructor(props: { repo: IIngredientRepo & IRecipeRepo }) {
        super(props);
        this.state = { editIngredient: new Ingredient(), mode: "", groupByCategory: true, searchQuery: ''};

        this.renderShoppingRow = this.renderShoppingRow.bind(this);
        this.showTransferButtons = this.showTransferButtons.bind(this);
        this.renderArchiveRow = this.renderArchiveRow.bind(this);
        this.renderDeleteButton = this.renderDeleteButton.bind(this);
        this.renderEditButton = this.renderEditButton.bind(this);
        this.renderInventoryRow = this.renderInventoryRow.bind(this);
        this.editIngredient = this.editIngredient.bind(this);
        this.getAllSearchedIngredients = this.getAllSearchedIngredients.bind(this);
        this.searchIngredients = this.searchIngredients.bind(this);

    }

    private searchInput: any;

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
                        let newState = !this.state.groupByCategory;
                        this.setState({ groupByCategory: newState });
                        document.body.click(); // HACK ALERT! This manually closes the popover after the user has selected an option
                    }}>Group</MenuItem>
                    <MenuItem eventKey="2" onClick={() => {
                        this.setState({ mode: "deleting" });
                        document.body.click(); // HACK ALERT! This manually closes the popover after the user has selected an option
                    }}>Delete</MenuItem>
                </ul>
            </Clearfix>
        </Popover>)

    // Returns a block of html to be dropped in to the appropriate column,
    // with a block for each group, outlined in a color,
    // with a row for each ingredient in that group
    private renderGroups(ingredients: Ingredient[]) {
        let groups = ingredients.map((i: Ingredient) => i.category).unique();

        let renderedGroups = [] as any[];

        groups.forEach((g: string) => {
            let groupRows = ingredients
                .filter((i: Ingredient) => i.category === g)
                .map((gr: Ingredient) => {
                    return this.renderShoppingRow(gr);
                });
            renderedGroups.push(
                <Row className="groupBox">
                    <Col sm={12}>
                        <ul className="list-group well">
                            <li className="list-group-item list-group-item-info" style={{ textAlign: 'center' }}>
                                {g === "" ? "Uncategorized" : g.capitalize()}
                            </li>
                            {groupRows}
                        </ul>
                    </Col>
                </Row>
            )
        });
        return renderedGroups;
    }

    private getAllSearchedIngredients(input: string, ingredients: Ingredient[]) {
        if(input.length >0) {
            return ingredients
                .filter((ingredient: Ingredient) => {
                    return ingredient.name.toLowerCase().indexOf(input.toLowerCase()) >=0;
                });
        } else {
            return ingredients;
        }
    }

    private searchIngredients(event: any) {
        this.setState({ searchQuery: event.target.value });
    }


    public render() {

        let archivedRows = this.getAllSearchedIngredients(this.state.searchQuery, this.props.repo.state.ingredients)
            .filter((ingredient: Ingredient) => ingredient.status === 'archived')
            .map((ingredient) => this.renderArchiveRow(ingredient));

        let shoppingRows;
        if (this.state.groupByCategory) {

            shoppingRows = this.renderGroups(this.getAllSearchedIngredients(this.state.searchQuery, this.props.repo.state.ingredients)
                .filter((ingredient: Ingredient) => ingredient.status === 'shopping'));
        } else {
            shoppingRows = this.getAllSearchedIngredients(this.state.searchQuery, this.props.repo.state.ingredients)
                .filter((ingredient: Ingredient) => ingredient.status === 'shopping')
                .map((ingredient) => this.renderShoppingRow(ingredient));
        }


        let inventoryRows = this.getAllSearchedIngredients(this.state.searchQuery, this.props.repo.state.ingredients)
            .filter((ingredient: Ingredient) => ingredient.status === 'inventory')
            .map((ingredient) => this.renderInventoryRow(ingredient));


        return (
            <Container id='ingredient_container'>
                <Grid>
                    <Row style={{margin: '10px'}}>
                        <Button style={{ marginTop: '3px' }}
                            bsSize='small'
                            onClick={() => {
                                this.searchInput.focus();
                            }}
                            className={"pull-right btn-circle classy-btn search-btn" + ((this.state.searchQuery.length > 0) ? " search-btn-open" : "")}>

                            <input placeholder="search" ref={(input) => { this.searchInput = input }} onChange={this.searchIngredients} />
                            <FaSearch size={15} className="pull-right" style={{ marginRight: '7px' }} />
                        </Button>
                    </Row>
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