import * as React from "react";
import { Navbar, Nav, NavItem } from "react-bootstrap";

export class Banner extends React.Component<{ authenticated: boolean, logout: (event: any) => void }> {
    constructor(props: { authenticated: boolean, logout: (event: any) => void }) {
        super(props);
    }

    public render() {
        let navItems = [] as JSX.Element[];
        if (this.props.authenticated) {
            navItems.push(<NavItem eventKey={1} href="#logout" onClick={this.props.logout}>Logout</NavItem>);
        } else {
            navItems.push(<NavItem eventKey={1} href="#login">Login</NavItem>);
            navItems.push(<NavItem eventKey={1} href="#createAccount">Create Account</NavItem>);
        }

        return (
            <Navbar>
                <Nav>
                    {navItems}


                    <NavItem eventKey={1} href="#home">
                        Home
                    </NavItem>
                    <NavItem eventKey={1} href="#photos/view">
                        Photos
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