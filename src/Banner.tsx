import * as React from "react";

import Navbar from "react-bootstrap/lib/Navbar";
import Nav from "react-bootstrap/lib/Nav";
import NavItem from "react-bootstrap/lib/NavItem";

export class Banner extends React.Component<{ authenticated: boolean, logout: (event: any) => void }, {user: string}> {
    constructor(props: { authenticated: boolean, logout: (event: any) => void }) {
        super(props);
        this.state = {user: ''}
        this.getUser = this.getUser.bind(this);
    }

    private async getUser() {
        await fetch('/api/getUser', {credentials: 'include'}).then((data: any) =>
            data.json()
        ).then((data: any) =>{
            this.setState({user: data.payload})
        });
    }

    public render() {
        let navItems = [] as JSX.Element[];
        if (this.props.authenticated) {
            navItems.push(<NavItem key="logout" eventKey={1} href="#logout" onClick={this.props.logout}>Logout</NavItem>);
        } else {
            navItems.push(<NavItem key="login" eventKey={1} href="#login">Login</NavItem>);
            navItems.push(<NavItem key="createAccount" eventKey={1} href="#createAccount">Create Account</NavItem>);
        }

        this.state.user === '' && this.getUser();
        return (
            <Navbar>
                { this.props.authenticated && <p className="navbar-text" style={{marginRight: "10px"}} >Welcome {this.state.user}!</p> }
                <Nav>
                    {navItems}


                    <NavItem eventKey={1} href="#home">
                        Home
                    </NavItem>
                    {/* <NavItem eventKey={1} href="#photos/view">
                        Photos
                    </NavItem> */}
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