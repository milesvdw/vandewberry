import * as React from "react";
import { Row, Col, FormGroup, Button } from "react-bootstrap";
import { Image } from "../models/image";
import { IPhotoRepo } from "./photosapp";

export class PhotoEditView extends React.Component<{ photo: Image, repo: IPhotoRepo, onSave: () => void }, { photo: Image }> {
    constructor(props: { photo: Image, repo: IPhotoRepo, onSave: () => void }) {
        super(props);
        console.log("PHOTO")
        console.log(props.photo);
        this.state = {
            photo: props.photo
        }
        this.updateFields = this.updateFields.bind(this);
    }

    private updateFields(event: any) {
        const field = event.target.name;
        const photo = this.state.photo;
        photo[field] = event.target.value;
        return this.setState({ photo });
    }

    public render() {
        return (
            <div>
                <Row>
                    <Col sm={12}>
                        <FormGroup>
                            <label htmlFor="title">
                                Photo Title
                            </label>
                            <input type='text' name='title' className='form-control' value={this.state.photo.title} onChange={this.updateFields} />
                        </FormGroup>
                    </Col>
                </Row>
                <Row>
                    <Col sm={12}>
                        <FormGroup>
                            <label htmlFor="url">
                                Url
                            </label>
                            <input type='text' name='url' className='form-control' value={this.state.photo.url} onChange={this.updateFields} />
                        </FormGroup>
                    </Col>
                </Row>
                <Row>
                    <Col sm={12}>
                        <FormGroup>
                            <label htmlFor="description">
                                Description
                            </label>
                            <textarea name='description' className='form-control' value={this.state.photo.description} onChange={this.updateFields} />
                        </FormGroup>
                    </Col>
                </Row>
                <Row>
                    <Col sm={12}>
                        <Button bsSize='large' bsStyle='info' className='pull-right'
                            onClick={() => {
                                this.props.repo.saveImage(this.state.photo);
                                this.props.onSave();
                            }}>Save</Button>
                    </Col>
                </Row>
            </div>

        )
    }
}