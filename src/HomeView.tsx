import * as React from "react";

import Grid from "react-bootstrap/lib/Grid";
import Row from "react-bootstrap/lib/Row";
import Col from "react-bootstrap/lib/Col";
import { IHomeRepo } from "./HomeApp";

import { Container } from "react-bootstrap/lib/Tab";


export class HomeView extends React.Component<{ repo: IHomeRepo }, {}> {

    constructor(props: { repo: IHomeRepo }) {
        super(props);

        this.renderMembers = this.renderMembers.bind(this);
    }

    private renderMembers() {
        return this.props.repo.state.members.map((member: string) => {
            return (
                <Row key={member}>
                    <Col sm={6}>
                        {member}
                    </Col>
                </Row>
            )
        })
    }

    public render() {
        return (
            <Container>
                <Grid>
                <p> Users in your household: </p>
                    {this.renderMembers()}
                </Grid>
            </Container>
        );
    }
}