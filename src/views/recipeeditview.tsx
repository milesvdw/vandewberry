import * as React from "react";
import { Row, Col, FormGroup, Button } from "react-bootstrap";
import { Recipe } from "../models/recipe";
import { IRecipeRepo } from "../FoodApp";
import { Material } from "../models/material";
import { FaMinusCircle, FaPlus } from "react-icons/lib/fa"
import { Ingredient } from "../models/ingredient";

export class RecipeEditView extends React.Component<{ recipe: Recipe, repo: IRecipeRepo, onSave: () => void }, { recipe: Recipe }> {
    constructor(props: { recipe: Recipe, repo: IRecipeRepo, onSave: () => void }) {
        super(props);
        this.state = {
            recipe: props.recipe
        }
        this.updateFields = this.updateFields.bind(this);
        this.updateMaterialFields = this.updateMaterialFields.bind(this);
        this.toggleMaterialRequired = this.toggleMaterialRequired.bind(this);
        this.removeMaterial = this.removeMaterial.bind(this);
        this.MaterialEditView = this.MaterialEditView.bind(this);
    }

    private updateFields(event: any) {
        const field = event.target.name;
        const recipe = this.state.recipe;
        recipe[field] = event.target.value;
        return this.setState({ recipe });
    }

    private updateMaterialFields(index: number) {
        return (event: any) => {
            const field = event.target.name;
            const recipe = this.state.recipe;
            let val = event.target.value;
            if (field === 'ingredients') { // hack to deal with zipped/unzipped material lists
                val = val.split(', ').map((word: string) => new Ingredient({ name: word }))
            }

            recipe.materials[index][field] = val;
            return this.setState({ recipe })
        }
    }

    private toggleMaterialRequired(index: number) {
        return (event: any) => {
            const recipe = this.state.recipe;
            recipe.materials[index].required = !recipe.materials[index].required
            return this.setState({ recipe })
        }
    }

    private removeMaterial(index: number) {
        let recipe = this.state.recipe;
        recipe.materials.splice(index, 1);
        this.setState({ recipe });
    }

    private MaterialEditView(material: Material, index: number) {
        return (
            <Row key={index}>
                <Col sm={1}>
                    {/* NOTE: the below code uses the 'pretty-checkbox' npm package to deliver something good looking */}
                    <div className='pretty p-rotate p-default' style={{ marginTop: '10px', marginLeft: '4px' }}>
                        <input type='checkbox' defaultChecked={material.required} name='required' onClick={this.toggleMaterialRequired(index)} />
                        <div className='state p-danger' >
                            <label />
                        </div>
                    </div>
                </Col>
                <Col sm={2}>
                    <input type='text' className='form-control' name='quantity' value={material.quantity} onChange={this.updateMaterialFields(index)} />
                </Col>
                <Col sm={8}>
                    <input type='text' className='form-control' name='ingredients' value={material.ingredients.map((ingredient: Ingredient) => ingredient.name).join(', ')} onChange={this.updateMaterialFields(index)} />
                </Col>
                <Col sm={1}>
                    <FaMinusCircle onClick={() => { this.removeMaterial(index); }} />
                </Col>
            </Row>
        )
    }

    public render() {
        let materials = this.state.recipe.materials.map((material: Material, index: number) => {
            return this.MaterialEditView(material, index);
        })
        return (
            <div>
                <Row>
                    <Col sm={6}>
                        <FormGroup>
                            <label htmlFor="name">
                                Recipe Name
                            </label>
                            <input type='text' name='name' className='form-control' value={this.state.recipe.name} onChange={this.updateFields} />
                        </FormGroup>
                    </Col>
                    <Col sm={6}>
                        <FormGroup>
                            <label htmlFor="calories">
                                Calories
                            </label>
                            <input type='text' name='calories' className='form-control' value={this.state.recipe.calories} onChange={this.updateFields} />
                        </FormGroup>
                    </Col>
                </Row>
                <Row>
                    <Col sm={12}>
                        <FormGroup>
                            <label htmlFor="description">
                                Recipe Description/Instructions
                            </label>
                            <textarea name='description' className='form-control' value={this.state.recipe.description} onChange={this.updateFields} />
                        </FormGroup>
                    </Col>
                </Row>
                <Row>
                    <Col sm={12}>
                        <FormGroup>
                            <label>
                                Recipe Ingredients (commas to separate possible substitution):
                            </label>
                        </FormGroup>
                    </Col>
                </Row>
                <Row>
                    <Col sm={1}>
                        <label>Req</label>
                    </Col>
                    <Col sm={2}>
                        <label>Qty</label>
                    </Col>
                    <Col sm={8}>
                        <label>Name</label>
                    </Col>
                </Row>
                {materials}
                <Row>
                    <Col>
                        <Button style={{ marginTop: '3px', marginRight: '17px' }}
                            bsSize='xsmall'
                            onClick={() => {
                                let recipe = this.state.recipe;
                                recipe.materials.push(new Material());
                                this.setState({recipe})
                                return;
                            }}
                            className="pull-right btn-circle classy-btn">
                            <FaPlus size={15} />
                        </Button>
                    </Col>
                </Row>
                <Row>
                    <br />
                </Row>
                <Row>
                    <Col sm={12}>
                        <Button bsSize='large' bsStyle='info' className='pull-right'
                            onClick={() => {
                                this.props.repo.saveRecipe(this.state.recipe);
                                this.props.onSave();
                            }}> Save</Button>
                    </Col>
                </Row>
            </div>

        )
    }
}