// tslint:disable:no-console
import * as React from 'react';
import './App.css';
import './pictures.css';
import { Banner } from './Banner';
import { HashRouter, Route, Switch } from "react-router-dom"
import { HomeApp } from './HomeApp';
import { FoodApp } from './FoodApp';
import { Login } from './Login';
import { IApiResponse } from './Database';
// import { PhotosApp } from './views/photosapp';
import { CreateAccount } from './CreateAccount';
import { Footer } from './Footer';
import { ToastContainer, toast } from 'react-toastify';
import 'react-toastify/dist/ReactToastify.min.css';

class App extends React.Component<{}, { error: boolean, authenticated: boolean, user: string }> {
  constructor(props: {}) {
    super(props);
    this.state = { error: false, authenticated: false, user: "" }

    this.authenticate = this.authenticate.bind(this);
    this.logout = this.logout.bind(this);
    this.notify = this.notify.bind(this);

    fetch('/api/checkSession', { credentials: 'include' })
      .then((data: any) => {
        return data.json();
      })
      .then((response: IApiResponse) => {
        if (response.authenticated) {
          this.authenticate(response.payload);
        }
      });
  }

  private notify() {
    toast.success('Wow so easy !', {position: toast.POSITION.BOTTOM_CENTER});
  }

  private logout(event: any) {
    event.stopPropagation();
    fetch('/api/logout', { credentials: 'include' }).then(() => {
      this.setState({ authenticated: false, user: "" });
    });
  }

  private authenticate(user: string) {
    this.setState({ authenticated: true, user });
    this.foodApp && this.foodApp.refresh();
    // this.photoApp && this.photoApp.refresh();
    this.homeApp && this.homeApp.refresh();
  }

  private foodApp: FoodApp | null;
  // private photoApp: PhotosApp | null;
  private homeApp: HomeApp | null;





  public render() {

    let showIfLoggedIn = (
      <div>
        <FoodApp ref={fa => { this.foodApp = fa }} />
        <HomeApp ref={ha => { this.homeApp = ha }} />
        {/* <Route path="/photos"
          component={() =>
            <PhotosApp ref={thing => { this.photoApp = thing }} /> */}
      </div>
    )

    return (
      <div>
        <Banner authenticated={this.state.authenticated} logout={this.logout} />
        <button onClick={this.notify}> Haha! </button>
        <ToastContainer />
        <HashRouter>
          <Switch>
            {this.state.authenticated && showIfLoggedIn}

            {!this.state.authenticated &&
              [<Route key="createAccountroute" path="/createAccount"
                component={() =>
                  <CreateAccount authenticate={this.authenticate} />
                }
              />,
              <Route key="loginRoute" path="/"
                component={() =>
                  <Login authenticate={this.authenticate} />
                }
              />]
            }
          </Switch>
        </HashRouter>
        <Footer/>
      </div>
    );
  }
}

export default App;
