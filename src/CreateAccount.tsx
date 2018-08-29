import * as React from "react";
import { Database } from "./Database";
import { Redirect } from "react-router-dom";

export class CreateAccount extends React.Component<{ authenticate: (user: string) => void }, { error: boolean, username: string, password: string, household: string, authenticated: boolean }> {
    constructor(props: { authenticate: () => void }) {
        super(props);
        this.state = { error: false, username: "", password: "", authenticated: false, household: "" }

        this.updateFields = this.updateFields.bind(this);
        this.createAccount = this.createAccount.bind(this);
    }

    private updateFields(event: any) {
        const field = event.target.name;
        let state = this.state;
        state[field] = event.target.value;
        return this.setState(state);
    }

    private createAccount(event: any) {
        event.preventDefault()

        Database.CreateAccount(this.state.username, this.state.password, this.state.household).then((authenticated: boolean) => {
            if (!authenticated) {
                return this.setState({ error: true })
            } else {
                window.location.hash = "/login";
            }
        });
    }

    public render() {
        return (
            <div>
                {this.state.authenticated && <Redirect to={'/home'} />}
                <form className='form-group' style={{padding: '10px'}} onSubmit={this.createAccount}>
                    <label htmlFor="username">
                        Username
                            </label>
                    <input type='text' name='username' className='form-control' value={this.state.username} onChange={this.updateFields} />
                    <label htmlFor="password">
                        Password
                            </label>
                    <input type='text' name='password' className='form-control' value={this.state.password} onChange={this.updateFields} />
                    <label htmlFor="household">
                        Household Name
                            </label>
                    <input type='text' name='household' className='form-control' value={this.state.household} onChange={this.updateFields} />
                    <button type="submit" style={{margin: '5px'}} >Create Account</button>
                </form>


                

                {this.state.error && (
                    <p>Bad account information</p>
                )}
            </div>
        )
    }
}