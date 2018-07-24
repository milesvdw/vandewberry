// tslint:disable:no-console
import * as React from 'react';
import './App.css';
import './pictures.css';
import { Banner } from './banner';
import { HashRouter, Route, Switch } from "react-router-dom"
import { HomeView } from './views/homeview';
import { FoodApp } from './FoodApp';

class App extends React.Component {

  public render() {
    return (
      <div>
        <Banner />
        <HashRouter>
          <Switch>
            <div>
              <FoodApp />
              <Route path="/home"
                component={() =>
                  <HomeView />
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
