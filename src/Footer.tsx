import * as React from "react";
import { Database } from "./Database";
import { FormGroup, Modal } from "react-bootstrap";
import Button from "react-bootstrap/lib/Button";
import { toast } from 'react-toastify';

export class Footer extends React.Component<{}, { title: string, body: string, bug: boolean }> {
    constructor(props: {}) {
        super(props);
        this.state = { title: "", body: "", bug: false };

        this.updateFields = this.updateFields.bind(this);
        this.submitBug = this.submitBug.bind(this);
    }

    private updateFields(event: any) {
        const field = event.target.name;
        let state = this.state;
        state[field] = event.target.value;
        return this.setState(state);
    }

    private submitBug(event: any) {
        event.preventDefault();
        return Database.ApiCall('/api/newIssue', {
            method: 'post',
            headers: {
                'Accept': 'application/json',
                'Content-Type': 'application/json',
            },
            body: JSON.stringify({
                title: this.state.title,
                body: this.state.body,
            })
        })
            .then((response: any) => {
                let answer = response;
                toast.success(answer);
                if (answer === 'Bug Submitted Successfully') {
                    this.setState({ title: "", body: "", bug: false });
                }
            });
    }

    public render() {
        return (
            <div style={{ position: 'fixed', textAlign: 'right', bottom: '0px', right: '0px' }}>
                <Button {...{ tooltip: 'Submit a bug for developer review' }}
                    style={{margin: '10px', textShadow: 'none'}}
                    onClick={() => this.setState({ bug: true })}
                    className='classy-btn no-outline btn-round btn-press btn-default'>
                    Bug Report
                </Button>
                <Modal show={this.state.bug} onHide={() => this.setState({ bug: false })}>
                    <Modal.Header>
                        <Modal.Title className="text-center">Bug Report</Modal.Title>
                    </Modal.Header>
                    <Modal.Body>
                        <form onSubmit={this.submitBug}>
                            <FormGroup {...{ tooltip: 'A brief title of the bug' }}>
                                <label htmlFor="title">Title</label>
                                <input type="text" className="form-control" name="title" aria-describedby="titleHelp" placeholder="Title" value={this.state.title} onChange={this.updateFields} />
                                <small id="titleHelp" className="form-text text-muted">A simple, descriptive title for the issue.</small>
                            </FormGroup>
                            <FormGroup {...{ tooltip: 'A detailed description of the bug and how it was discovered' }}>
                                <label htmlFor="body">Information</label>
                                <textarea rows={4} className="form-control" name="body" aria-describedby="bodyHelp" placeholder="Steps to reproduce:..." value={this.state.body} onChange={this.updateFields} />
                                <small id="bodyHelp" className="form-text text-muted">Any information you can provide about the issue.</small>
                            </FormGroup>
                            <FormGroup>
                                <Button {...{ tooltip: 'Submit Bug for review on Github' }} type="submit"
                                    className='classy-btn no-outline btn-round btn-press btn-default'
                                    style={{ textShadow: 'none'}}>
                                    Submit Bug
                                </Button>
                            </FormGroup>
                        </form>
                    </Modal.Body>
                </Modal>
            </div>
        );
    }
}