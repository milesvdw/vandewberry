import * as React from "react";
import { Database } from "src/Database";
import { Route } from "react-router";
import { HomeView } from "./HomeView";


export interface IHomeRepo {
    state: { members: string[] };
}


export class HomeApp extends React.Component<{}, { members: string[] }> implements IHomeRepo {

    constructor(props: {}) {
        super(props);

        this.state = {
            members: []
        }
    }

    public componentDidMount() {
        this.refresh();
    }

    public refresh() {
        Database.GetHouseholdMembers()
            .then((data: any) => {
                this.setState({
                    members: data
                });
            });
    }

    public render() {
        return (
            <Route path="/home"
                component={() =>
                    <HomeView repo={this} />
                }
            />
        );
    }
}