// tslint:disable:no-console
import * as React from 'react';
import './App.css';
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
          <FoodApp />
          <Route exact path="/home"
            component={() =>
              <HomeView />
            }
          />
        </Switch>
      </HashRouter>
      </div>
    );
  }
}

export default App;
