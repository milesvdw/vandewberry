import * as React from "react";

import Row from "react-bootstrap/lib/Row";
import Col from "react-bootstrap/lib/Col";
import FormGroup from "react-bootstrap/lib/FormGroup";
import Button from "react-bootstrap/lib/Button";

import { Image } from "../models/image";
import { Rotation } from "../models/rotation";
import { IPhotoRepo } from "./photosapp";

import FaRotateLeft from "react-icons/lib/fa/rotate-left";
import FaRepeat from "react-icons/lib/fa/repeat";
import FaClose from "react-icons/lib/fa/close";
import FaArrowsH from "react-icons/lib/fa/arrows-h";

export class PhotoEditView extends React.Component<{ photo: Image, repo: IPhotoRepo, onSave: () => void }, { photo: Image }> {
    constructor(props: { photo: Image, repo: IPhotoRepo, onSave: () => void }) {
        super(props);
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
        let previewRotationClass;
        if (this.state.photo.rotation === Rotation.LEFT) {
            previewRotationClass = "rotate270 extra-margin";
        } else if (this.state.photo.rotation === Rotation.RIGHT) {
            previewRotationClass = "rotate90 extra-margin";
        } else if (this.state.photo.rotation === Rotation.FLIP) {
            previewRotationClass = "rotate180";
        }


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
                            <label htmlFor="title">
                                Date Taken (ddmmyyyy)
                            </label>
                            <input type='text' name='date_taken' className='form-control' value={this.state.photo.date_taken} onChange={this.updateFields} />
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
                        <img
                            key={this.state.photo._id}
                            src={this.state.photo.url}
                            style={{ maxWidth: '50vw', maxHeight: '40vh' }}
                            alt={this.state.photo.title}
                            className={previewRotationClass} />
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
                    <Col sm={4}>
                        <label htmlFor="rotation">
                            Rotation
                        </label>
                    </Col>
                    <Col sm={8}>
                        <div className="pretty p-default p-round">
                            <input type="radio" name="rotation" value={Rotation.NONE} checked={this.state.photo.rotation === Rotation.NONE} onChange={this.updateFields} />
                            <div className="state p-info-o p-off">
                                <FaClose />
                            </div>
                        </div>
                        <div className="pretty p-default p-round">
                            <input type="radio" name="rotation" value={Rotation.LEFT} checked={this.state.photo.rotation === Rotation.LEFT} onChange={this.updateFields} />
                            <div className="state p-info-o p-off">
                                <FaRotateLeft />
                            </div>
                        </div>
                        <div className="pretty p-default p-round">
                            <input type="radio" name="rotation" value={Rotation.RIGHT} checked={this.state.photo.rotation === Rotation.RIGHT} onChange={this.updateFields} />
                            <div className="state p-info-o p-off">
                                <FaRepeat />
                            </div>
                        </div>
                        <div className="pretty p-default p-round">
                            <input type="radio" name="rotation" value={Rotation.FLIP} checked={this.state.photo.rotation === Rotation.FLIP} onChange={this.updateFields} />
                            <div className="state p-info-o p-off">
                                <FaArrowsH />
                            </div>
                        </div>
                    </Col>
                    <br />
                    <br />
                    <br />
                    <br />
                    <br />
                </Row>
                <Row>
                    <Col sm={12}>
                        <Button bsSize='large' bsStyle='danger' className='pull-left'
                            onClick={() => {
                                this.props.repo.deleteImage(this.state.photo);
                                this.props.onSave();
                            }}>Delete</Button>
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