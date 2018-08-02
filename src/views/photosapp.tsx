import * as React from "react";
import { Navbar, NavItem, Nav } from "react-bootstrap";
import { Route, Switch } from "react-router-dom";
import { PhotoViewer } from "./photoviewer";
import { PhotoManager } from "./photomanager";
import { Image } from "../models/image";
import { Database } from "../database";

export interface IPhotoRepo {
    state: { photos: Image[] };
    saveImage: (image: Image) => void;
}

export class PhotosApp extends React.Component<{}, { photos: Image[] }> implements IPhotoRepo {
    constructor(props: {}) {
        super(props);

        this.state = {
            photos: []
        }
    }


    public componentDidMount() {
        this.refresh();
    }

    public refresh() {

        Database.GetPhotos()
            .then((data: any) => {
                this.setState({
                    photos: data.map((item: any) => new Image(item))
                });
                console.log(data.map((item: any) => new Image(item)))
            });
    }

    public async saveImage(photo: Image) {

        let savedPhoto: Image = await photo.Save();
        let photos = this.state.photos;

        let existingPhotoIndex: number | undefined = photos.findIndex((searchPhoto: Image) => {
            return searchPhoto._id === savedPhoto._id;
        })
        if (existingPhotoIndex >= 0) {
            photos.splice(existingPhotoIndex, 1);
        }

        photos.push(savedPhoto);

        this.setState({ photos });
        return;
    }

    public render() {


        return (
            <div>
                <Navbar className="subnav">
                    <Nav>
                        <NavItem eventKey={1} href="#photos/view">
                            View Photos
                        </NavItem>
                        <NavItem eventKey={1} href="#photos/manage">
                            Manage Photos
                        </NavItem>
                    </Nav>
                </Navbar>

                <Switch>
                    <div>

                        <Route exact path="/photos/view"
                            component={() =>
                                <PhotoViewer repo={this} />
                            }
                        />
                        <Route exact path="/photos/manage"
                            component={() =>
                                <PhotoManager />
                            }
                        />
                    </div>
                </Switch>

            </div>
        );
    }
}