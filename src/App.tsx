// tslint:disable:no-console
import * as React from 'react';
import './App.css';
import './pictures.css';
import { Banner } from './banner';
import { HashRouter, Route, Switch } from "react-router-dom"
import { HomeView } from './views/homeview';
import { FoodApp } from './FoodApp';
import { Login } from './Login';

class App extends React.Component<{}, { error: boolean, authenticated: boolean, user: string }> {
  constructor(props: {}) {
    super(props);
    this.state = { error: false, authenticated: false, user: "" }

    this.authenticate = this.authenticate.bind(this);
    this.logout = this.logout.bind(this);
    
  }

  private logout(event: any) {
    event.stopPropagation();
    fetch('/api/logout');
    this.setState({ authenticated: false, user: "" });
  }

  private authenticate(user: string) {
    this.setState({ authenticated: true, user });
    this.foodApp && this.foodApp.refresh();
  }

  private foodApp: FoodApp | null;




  public render() {
    let showIfLoggedIn = (
      <div id='protected'>
        <FoodApp ref={thing => { this.foodApp = thing }} />
        <Route path="/home"
          component={() =>
            <HomeView />
          }
        />
      </div>
    )

    return (
      <div>
        <Banner authenticated={this.state.authenticated} logout={this.logout} />
        <HashRouter>
          <Switch>
            <div>
              {this.state.authenticated && showIfLoggedIn}
              <Route path="/login"
                component={() =>
                  <Login authenticate={this.authenticate} />

                }
              />
            </div>
          </Switch>
        </HashRouter>
      </div>
    );
  }
}

export default App;
