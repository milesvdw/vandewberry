import * as React from "react";
import { Database } from "./Database";
import { Redirect } from "react-router-dom";

import Panel from "react-bootstrap/lib/Panel";
import Button from "react-bootstrap/lib/Button";
import { User } from "src/models/User";

export class Login extends React.Component<{ authenticate: (user: User) => void }, { error: boolean, user: User, username: string, password: string, authenticated: boolean }> {
    constructor(props: { authenticate: () => void }) {
        super(props);
        this.state = { error: false, user: new User(), username: "", password: "", authenticated: false }

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

        Database.Login(this.state.username, this.state.password).then((payload: { authenticated: boolean, payload: User}) => {
            if (!payload.authenticated) {
                return this.setState({ error: true })
            } else {
                this.setState({ authenticated: true });
                this.props.authenticate(payload.payload)
                window.location.hash = "/home";
            }
        });
    }

    public render() {
        return (
            <div>
                {this.state.authenticated && <Redirect to={'/home'} />}
                <Panel style={{ margin: '20px' }}>
                    <Panel.Heading>
                        Login
                    </Panel.Heading>
                    <Panel.Body>
                        <form className='form-group' style={{ padding: '10px' }} onSubmit={this.attemptLogin}>
                            <label htmlFor="username">
                                Username
                            </label>
                            <input type='text' name='username' className='form-control' value={this.state.username} onChange={this.updateFields} />
                            <label htmlFor="password">
                                Password
                            </label>
                            <input type='password' name='password' className='form-control' value={this.state.password} onChange={this.updateFields} />
                            <Button type="submit"
                                className='classy-btn no-outline btn-round btn-press btn-default'
                                style={{ marginLeft: '0', marginTop: '15px', float: 'right', fontSize: '14px', textShadow: 'none' }}
                            >
                                Login
                            </Button>
                        </form>
                    </Panel.Body>
                </Panel>



                {this.state.error && (
                    <p>Bad login information</p>
                )}
            </div>
        )
    }
}