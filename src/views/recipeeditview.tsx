import * as React from "react";
import { Row, Col, FormGroup, Button } from "react-bootstrap";
import { Recipe } from "../models/recipe";
import { IRecipeRepo } from "../FoodApp";
import { Material } from "../models/material";
import { FaMinusCircle } from "react-icons/lib/fa"

export class RecipeEditView extends React.Component<{ recipe: Recipe, repo: IRecipeRepo, onSave: () => void }, { recipe: Recipe }> {
    constructor(props: { recipe: Recipe, repo: IRecipeRepo, onSave: () => void }) {
        super(props);
        this.state = {
            recipe: props.recipe
        }
        this.updateFields = this.updateFields.bind(this);
    }

    private updateFields(event: any) {
        console.log('changed');
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
            if (field === 'materials') { // hack to deal with zipped/unzipped material lists
                val = val.split(', ')
            }
            recipe.materials[index][field] = val;
            return this.setState({ recipe })
        }
    }

    private removeMaterial(index: number) {
        let recipe = this.state.recipe;
        recipe.materials.splice(index, 1);
        this.setState({ recipe });
    }

    private MaterialEditView(material: Material, index: number) {
        console.log(material.ingredients);
        return (
            <Row key={index}>
                <Col sm={1}>
                    <label htmlFor="required" className='label-cbx' >
                        <input checked={material.required} className='invisible' onChange={this.updateMaterialFields(index)} />
                        <div className="checkbox">
                            <svg width="20px" height="20px" viewBox="0 0 20 20">
                                <path d="M3,1 L17,1 L17,1 C18.1045695,1 19,1.8954305 19,3 L19,17 L19,17 C19,18.1045695 18.1045695,19 17,19 L3,19 L3,19 C1.8954305,19 1,18.1045695 1,17 L1,3 L1,3 C1,1.8954305 1.8954305,1 3,1 Z" />
                                <polyline points="4 11 8 15 16 6" />
                            </svg>
                        </div>
                    </label>
                </Col>
                <Col sm={2}>
                    <input type='text' className='form-control' value={material.quantity} onChange={this.updateMaterialFields(index)} />
                </Col>
                <Col sm={8}>
                    <input type='text' className='form-control' value={material.ingredients.join(', ')} onChange={this.updateMaterialFields(index)} />
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
                    <Col sm={12}>
                        <FormGroup>
                            <label htmlFor="name">
                                Recipe Name
                        </label>
                            <input type='text' id='name' name='name' className='form-control' value={this.state.recipe.name} onChange={this.updateFields} />
                        </FormGroup>
                    </Col>
                </Row>
                <Row>
                    <Col sm={12}>
                        <FormGroup>
                            <label htmlFor="name">
                                Recipe Description/Instructions
                            </label>
                            <textarea id='name' name='description' className='form-control' value={this.state.recipe.description} onChange={this.updateFields} />
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