import * as React from "react";
import { FormGroup } from "react-bootstrap";
import { Database } from "./database";
import { Redirect } from "react-router-dom";

export class Login extends React.Component<{ authenticate: (user: string) => void }, { error: boolean, username: string, password: string, authenticated: boolean }> {
    constructor(props: { authenticate: () => void }) {
        super(props);
        this.state = { error: false, username: "", password: "", authenticated: false }

        this.updateFields = this.updateFields.bind(this);
        this.attemptLogin = this.attemptLogin.bind(this);
    }

    private updateFields(event: any) {
        const field = event.target.name;
        let state = this.state;
        state[field] = event.target.value;
        return this.setState(state);
    }

    private attemptLogin(event: any) {
        event.preventDefault()

        Database.Login(this.state.username, this.state.password).then((authenticated: boolean) => {
            if (!authenticated) {
                return this.setState({ error: true })
            } else {
                this.setState({ authenticated: true })
                this.props.authenticate(this.state.username)
                window.location.hash = "/home";
            }
        });
    }

    public render() {
        console.log(this.state.authenticated);
        return (
            <div>
                {this.state.authenticated && <Redirect to={'/home'} />}
                <FormGroup>
                    <label htmlFor="username">
                        Username
                            </label>
                    <input type='text' name='username' className='form-control' value={this.state.username} onChange={this.updateFields} />
                    <label htmlFor="password">
                        Password
                            </label>
                    <input type='text' name='password' className='form-control' value={this.state.password} onChange={this.updateFields} />
                </FormGroup>


                <button type="submit" onClick={this.attemptLogin} >login</button>

                {this.state.error && (
                    <p>Bad login information</p>
                )}
            </div>
        )
    }
}