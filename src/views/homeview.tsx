import * as React from "react";

export class HomeView extends React.Component {

    public render() {


        return (
            <div>
                <div className="main-photo-container">
                    <span className="closebtn">&times;</span>

                    {/* <img style={{ width: '100%' }} src={this.props.repo.mainImage} /> */}

                    <div className="imgtext" />
                </div>
                <div className="photo-grid">
                    <img src="https://s3-us-west-2.amazonaws.com/s.cdpn.io/71829/mona-lisa.jpg" alt="Mona Lisa" />
                    <img src="https://s3-us-west-2.amazonaws.com/s.cdpn.io/71829/mona-lisa.jpg" alt="Mona Lisa" />
                    <img src="https://s3-us-west-2.amazonaws.com/s.cdpn.io/71829/mona-lisa.jpg" alt="Mona Lisa" />
                    <img src="https://s3-us-west-2.amazonaws.com/s.cdpn.io/71829/mona-lisa.jpg" alt="Mona Lisa" />
                    <img src="https://s3-us-west-2.amazonaws.com/s.cdpn.io/71829/mona-lisa.jpg" alt="Mona Lisa" />
                </div>
            </div>
        );
    }
}