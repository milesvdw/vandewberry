import * as React from "react";
import { Image } from "../models/image";

export class PhotosApp extends React.Component<{}, { selectedImage: Image | null }> {
    constructor(props: {}) {
        super(props);

        this.state = { selectedImage: null }
    }

    public refresh() {
        return;
    }

    public render() {


        return (
            <div>
                <div className="main-photo-container" style={{ display: this.state.selectedImage ? "block" : "none" }}>
                    <span className="closebtn" onClick={() => { this.setState({ selectedImage: null }) }} > &times;</span>


                    <div style={{ maxWidth: '50vw', maxHeight: '55vh', margin: 'auto', display: 'block', }}>
                        <img style={{ maxWidth: '50vw', maxHeight: '50vh', margin: 'auto', display: 'block', }} src={this.state.selectedImage ? this.state.selectedImage.url : ""} />

                        <p className="imgtext" style={{ width: '100%', textAlign: 'center', maxHeight: '5vh', margin: 'auto', display: 'inline-block' }}>
                            {this.state.selectedImage && this.state.selectedImage.description}
                        </p>

                    </div>
                </div>
                <div className="photo-grid">
                    <img src="https://s3-us-west-2.amazonaws.com/s.cdpn.io/71829/mona-lisa.jpg" alt="Mona Lisa"
                        onClick={() => { this.setState({ selectedImage: { url: "https://s3-us-west-2.amazonaws.com/s.cdpn.io/71829/mona-lisa.jpg", description: "image 1" } }) }} />
                    <img src="https://s3-us-west-2.amazonaws.com/s.cdpn.io/71829/mona-lisa.jpg" alt="Mona Lisa"
                        onClick={() => { this.setState({ selectedImage: { url: "https://s3-us-west-2.amazonaws.com/s.cdpn.io/71829/mona-lisa.jpg", description: "image 2" } }) }} />
                    <img src="https://s3-us-west-2.amazonaws.com/s.cdpn.io/71829/mona-lisa.jpg" alt="Mona Lisa" />
                    <img src="https://s3-us-west-2.amazonaws.com/s.cdpn.io/71829/mona-lisa.jpg" alt="Mona Lisa" />
                    <img src="https://s3-us-west-2.amazonaws.com/s.cdpn.io/71829/mona-lisa.jpg" alt="Mona Lisa" />
                </div>
            </div>
        );
    }
}