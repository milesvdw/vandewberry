import * as React from "react";
import { Navbar, NavItem, Nav } from "react-bootstrap";
import { Route } from "react-router-dom";
import { PhotoViewer } from "./photoviewer";
import { PhotoManager } from "./photomanager";
import { Image } from "../models/image";

export class PhotosApp extends React.Component<{}, { selectedImage: Image | null }> {
    constructor(props: {}) {
        super(props);
    }

    public refresh() {
        return;
    }

    public render() {


        return (
            <div>
                <Navbar className="subnav">
                    <Nav>
                        <NavItem eventKey={1} href="#photos">
                            View Photos
                    </NavItem>
                        <NavItem eventKey={1} href="#photos/manage">
                            Manage Photos
                    </NavItem>
                    </Nav>
                </Navbar>
                <Route exact path="/photos"
                    component={() =>
                        <PhotoViewer />
                    }
                />
                <Route exact path="/photos/manage"
                    component={() =>
                        <PhotoManager />
                    }
                />

            </div>
        );
    }
}