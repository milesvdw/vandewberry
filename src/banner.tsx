import * as React from "react";
import { Navbar, Nav, NavItem } from "react-bootstrap";

export class Banner extends React.Component {
    public render() {

        return (
            <Navbar>
                <Nav>
                    <NavItem eventKey={1} href="#home">
                        Home
                    </NavItem>
                    <NavItem eventKey={1} href="#recipes">
                        Recipes
                    </NavItem>
                    <NavItem eventKey={1} href="#inventory">
                        Inventory
                    </NavItem>
                </Nav>
            </Navbar>
        );
    }
}