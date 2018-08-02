import * as React from "react";
import { Image } from "../models/image";
import { Modal, Row, Col, Button } from "react-bootstrap";
import { PhotoEditView } from "./photoeditview";
import { IPhotoRepo } from "./photosapp";
import { FaPlus, FaTimesCircle, FaCaretLeft, FaCaretRight } from "react-icons/lib/fa";

export class PhotoViewer extends React.Component<{ repo: IPhotoRepo }, { selectedImage: Image | null, mode: string, editImage: Image }> {
    constructor(props: { repo: IPhotoRepo }) {
        super(props);

        this.state = { selectedImage: null, mode: "", editImage: new Image() }
    }

    public render() {

        let photos = this.props.repo.state.photos.map((image: Image) => {
            return (
                <img
                    key={image._id}
                    src={image.url}
                    alt={image.title}
                    onClick={() => { this.setState({ selectedImage: image }) }} />)

        });
        return (
            <div>
                <Modal show={this.state.mode === "editing"} onHide={() => this.setState({ mode: "" })}>
                    <Modal.Header>
                        <Modal.Title className="text-center">Add Item</Modal.Title>
                    </Modal.Header>
                    <Modal.Body>
                        <Row>
                            <Col sm={12} id='new_ingredient'>
                                <PhotoEditView
                                    photo={this.state.editImage}
                                    repo={this.props.repo}
                                    onSave={() => { this.setState({ mode: "" }) }} />
                            </Col>
                        </Row>
                    </Modal.Body>
                </Modal>

                <Button style={{ marginTop: '3px' }}
                    bsSize='small'
                    onClick={() => {
                        let photo = new Image();
                        this.setState({ editImage: photo, mode: "editing" })
                    }}
                    className="btn-circle classy-btn">
                    <FaPlus size={15} />
                </Button>
                <Modal backdropClassName='dark' dialogClassName='transparent' show={this.state.selectedImage != null} onHide={() => this.setState({ mode: "" })}>
                    <Modal.Body className='transparent'>

                        <div className="main-photo-container" style={{ display: this.state.selectedImage ? "block" : "none" }}>


                            <div style={{ maxWidth: '50vw', maxHeight: '55vh', margin: 'auto', display: 'block', }}>
                                <Button
                                    bsSize='xsmall'
                                    onClick={() => {
                                        this.setState({ selectedImage: null })
                                    }}
                                    className="btn-circle classy-btn">
                                    <FaTimesCircle size={15} />
                                </Button>
                                <Button
                                    bsSize='xsmall'
                                    onClick={() => {
                                        let val = this.props.repo.state.photos.findIndex((a: Image) => a === this.state.selectedImage) - 1;
                                        let index = val > 0 ? val : this.props.repo.state.photos.length - 1;
                                        this.setState({ selectedImage: this.props.repo.state.photos[index] })
                                    }}
                                    className="btn-circle classy-btn">
                                    <FaCaretLeft size={15} />
                                </Button>
                                <Button
                                    bsSize='xsmall'
                                    onClick={() => {
                                        let val = this.props.repo.state.photos.findIndex((a: Image) => a === this.state.selectedImage) + 1;
                                        let index = val < this.props.repo.state.photos.length ? val : 0;
                                        this.setState({ selectedImage: this.props.repo.state.photos[index] })
                                    }}
                                    className="btn-circle classy-btn">
                                    <FaCaretRight size={15} />
                                </Button>
                                <img style={{ maxWidth: '50vw', maxHeight: '50vh', margin: 'auto', display: 'block', }} src={this.state.selectedImage ? this.state.selectedImage.url : ""} />

                                <p className="imgtext" style={{ width: '100%', textAlign: 'center', maxHeight: '5vh', margin: 'auto', display: 'inline-block' }}>
                                    {this.state.selectedImage && this.state.selectedImage.description}
                                </p>

                            </div>
                        </div>
                    </Modal.Body>
                </Modal>
                <div className="photo-grid">
                    {photos}
                </div>
            </div>
        )
    }
}