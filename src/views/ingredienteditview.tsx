import * as React from "react";

import Row from "react-bootstrap/lib/Row";
import Col from "react-bootstrap/lib/Col";
import FormGroup from "react-bootstrap/lib/FormGroup";
import Button from "react-bootstrap/lib/Button";

import { IIngredientRepo } from "../FoodApp";
import { Ingredient } from "../models/ingredient";

export class IngredientEditView extends React.Component<{ ingredient: Ingredient, repo: IIngredientRepo, onSave: () => void }, { ingredient: Ingredient }> {
    constructor(props: { ingredient: Ingredient, repo: IIngredientRepo, onSave: () => void }) {
        super(props);
        this.state = {
            ingredient: props.ingredient
        }
        this.updateFields = this.updateFields.bind(this);
        this.toggleIngredientExpires = this.toggleIngredientExpires.bind(this);
    }

    private updateFields(event: any) {
        const field = event.target.name;
        const ingredient = this.state.ingredient;
        ingredient[field] = event.target.value;
        return this.setState({ ingredient });
    }

    private toggleIngredientExpires() {
        const ingredient = this.state.ingredient;
        ingredient.expires = !ingredient.expires;
        this.setState({ ingredient });
    }

    public render() {
        return (
            <div>
                <Row>
                    <Col sm={12}>
                        <FormGroup>
                            <label htmlFor="name">
                                Ingredient Name
                            </label>
                            <input type='text' name='name' className='form-control' value={this.state.ingredient.name} onChange={this.updateFields} />
                        </FormGroup>
                    </Col>
                </Row>
                <Row>
                    <Col sm={12}>
                        <FormGroup>
                            <label htmlFor="description">
                                Category (e.g. 'deli' or 'produce'
                            </label>
                            <textarea name='category' className='form-control' value={this.state.ingredient.category} onChange={this.updateFields} />
                        </FormGroup>
                    </Col>
                </Row>
                <Row>
                    <Col sm={12}>
                        <FormGroup>
                            <label htmlFor="expires">
                                Does it ever expire?
                            </label>

                            {/* NOTE: the below code uses the 'pretty-checkbox' npm package to deliver something good looking */}
                            <div className='pretty p-rotate p-default' style={{ marginTop: '10px', marginLeft: '4px' }}>
                                <input type='checkbox' defaultChecked={this.state.ingredient.expires} name='expires' onClick={this.toggleIngredientExpires} />
                                <div className='state p-danger' >
                                    <label />
                                </div>
                            </div>
                        </FormGroup>
                    </Col>
                </Row>
                <Row>
                    <Col sm={12}>
                        <FormGroup>
                            <label htmlFor="description">
                                If so, how many days does it last?
                            </label>
                            <textarea name='shelf_life' className='form-control' value={this.state.ingredient.shelf_life} onChange={this.updateFields} />
                        </FormGroup>
                    </Col>
                </Row>
                <Row>
                    <Col sm={12}>
                        <Button bsSize='large' bsStyle='info' className='pull-right'
                            onClick={() => {
                                this.props.repo.saveIngredient(this.state.ingredient);
                                this.props.onSave();
                            }}> Save</Button>
                    </Col>
                </Row>
            </div>

        )
    }
}