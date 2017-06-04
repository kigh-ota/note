// @flow
import * as React from 'react';
import {ipcRenderer} from 'electron';
import TextField from 'material-ui/TextField';
import FloatingActionButton from 'material-ui/FloatingActionButton';
import ContentSave from 'material-ui/svg-icons/content/save';
import Paper from 'material-ui/Paper';

type State = {
    title: string,
    content: string,
};

const initState: State = {
    title: '',
    content: '',
};

export default class NoteEditor extends React.PureComponent {
    state: State;

    constructor() {
        super();
        this.state = initState;
    }

    handleSave(): void {
        ipcRenderer.send('ADD_NOTE', this.state);
        this.setState(initState);
    }

    render() {
        const canSave: boolean = !!this.state.title || !!this.state.content;

        return (
            <div>
                <Paper
                    zDepth={1}
                    rounded={false}
                    style={{
                        margin: '8px',
                        padding: '8px',
                    }}
                >
                    <TextField
                        name="titleInput"
                        floatingLabelText="Title"
                        fullWidth={true}
                        value={this.state.title}
                        onChange={(e: Object, newValue: string) => {this.setState({title: newValue});}}
                    /><br />
                    <TextField
                        name="contentInput"
                        floatingLabelText="Content"
                        multiLine={true}
                        rows={10}
                        fullWidth={true}
                        value={this.state.content}
                        onChange={(e: Object, newValue: string) => {this.setState({content: newValue});}}
                    /><br />
                    <FloatingActionButton
                        onTouchTap={this.handleSave.bind(this)}
                        disabled={!canSave}
                    >
                        <ContentSave />
                    </FloatingActionButton>
                </Paper>
            </div>
        );
    }
}
