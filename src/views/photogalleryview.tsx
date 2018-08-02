import * as React from "react";
import { Image } from "../models/image";

export class PhotosGallery extends React.Component<{}, { selectedImage: Image | null }> {
    constructor(props: {}) {
        super(props);

        this.state = { selectedImage: null }
        this.closeModal = this.closeModal.bind(this);
        this.plusSlides = this.plusSlides.bind(this);
        this.currentSlide = this.currentSlide.bind(this);
    }

    private closeModal() {
        return null;
    }

    private plusSlides(n: number) {
        return null;
    }

    private currentSlide(n: number) {
        return null;
    }

    public render() {
        return (
            <div id="myModal" className="photo-modal">
                <span className="close cursor" onClick={() => {this.closeModal()}}>&times;</span>
                <div className="modal-content">

                    <div className="mySlides">
                    <div className="numbertext">1 / 4</div>
                    <img src="img1_wide.jpg" style={{ width: '100%' }}/>
                    </div>

                    <div className="mySlides">
                    <div className="numbertext">2 / 4</div>
                    <img src="img2_wide.jpg" style={{ width: '100%' }}/>
                    </div>

                    <div className="mySlides">
                    <div className="numbertext">3 / 4</div>
                    <img src="img3_wide.jpg" style={{ width: '100%' }}/>
                    </div>

                    <div className="mySlides">
                    <div className="numbertext">4 / 4</div>
                    <img src="img4_wide.jpg" style={{ width: '100%' }}/>
                    </div>

                    {/* <!-- Next/previous controls --> */}
                    <a className="prev" onClick={() => {this.plusSlides(-1)}}>&#10094;</a>
                    <a className="next" onClick={() => {this.plusSlides(1)}}>&#10095;</a>

                    {/* <!-- Caption text --> */}
                    <div className="caption-container">
                    <p id="caption"/>
                    </div>

                    {/* <!-- Thumbnail image controls --> */}
                    <div className="column">
                    <img className="demo" src="img1.jpg" onClick={() => {this.currentSlide(1)}}/>
                    </div>

                    <div className="column">
                    <img className="demo" src="img2.jpg" onClick={() => {this.currentSlide(2)}}/>
                    </div>

                    <div className="column">
                    <img className="demo" src="img3.jpg" onClick={() => {this.currentSlide(3)}}/>
                    </div>

                    <div className="column">
                    <img className="demo" src="img4.jpg" onClick={() => {this.currentSlide(4)}}/>
                    </div>
                </div>
            </div>
        );
    }
}