// @flow
import * as React from 'react';
import {ipcRenderer} from 'electron';
import TextField from 'material-ui/TextField';
import FloatingActionButton from 'material-ui/FloatingActionButton';
import Snackbar from 'material-ui/Snackbar';
import ContentSave from 'material-ui/svg-icons/content/save';
import Paper from 'material-ui/Paper';
import Divider from 'material-ui/Divider';
import type {Note} from '../types/AppTypes';

type State = {
    id?: number,
    title: string,
    content: string,
    modified: boolean,
    autoSaveNotify: boolean,
};

const initState: State = {
    title: '',
    content: '',
    modified: false,
    autoSaveNotify: false,
};

const AUTO_SAVE_INTERVAL_SEC = 5;

export default class NoteEditor extends React.PureComponent {
    state: State;
    autoSaveTimer: number;

    constructor() {
        super();
        this.state = initState;
    }

    noteObject(): Note {
        let note = {};
        note.title = this.state.title;
        note.content = this.state.content;
        if (this.state.id) {
            note.id = this.state.id;
        }
        return note;
    }

    canSave(): boolean {
        return (!!this.state.title || !!this.state.content) && this.state.modified;
    }

    componentDidMount() {
        ipcRenderer.on('AUTO_SAVE_NOTE_REPLY', (event: Object, id: number) => {
            this.setState({
                id: id,
                autoSaveNotify: true,
            });
        });
        this.autoSaveTimer = setInterval(() => {
            if (this.canSave()) {
                ipcRenderer.send('AUTO_SAVE_NOTE', this.noteObject());
                this.setState({modified: false});
            }
        }, AUTO_SAVE_INTERVAL_SEC * 1000);
    }

    componentWillUnmount() {
        clearInterval(this.autoSaveTimer);
    }

    handleSave(): void {
        ipcRenderer.send('ADD_NOTE', this.noteObject());
        this.setState(initState);
    }

    render() {

        return (
            <div>
                <Paper
                    zDepth={1}
                    rounded={false}
                    style={{
                        margin: '8px',
                    }}
                >
                    <TextField
                        name="titleInput"
                        style={{
                            margin: '8px',
                        }}
                        hintText="Title"
                        underlineShow={false}
                        fullWidth={true}
                        value={this.state.title}
                        onChange={(e: Object, newValue: string) => {
                            this.setState({
                                title: newValue,
                                modified: true,
                            });
                        }}
                    />
                    <Divider/>
                    <TextField
                        name="contentInput"
                        style={{
                            margin: '8px',
                        }}
                        hintText="Content"
                        underlineShow={false}
                        multiLine={true}
                        rows={10}
                        fullWidth={true}
                        value={this.state.content}
                        onChange={(e: Object, newValue: string) => {this.setState({
                            content: newValue,
                            modified: true,
                        });}}
                    />
                    <Divider/>
                    <FloatingActionButton
                        style={{
                            margin: '8px',
                        }}
                        onTouchTap={this.handleSave.bind(this)}
                        disabled={!this.canSave()}
                    >
                        <ContentSave />
                    </FloatingActionButton>
                </Paper>
                <Snackbar
                    open={this.state.autoSaveNotify}
                    message="Note saved."
                    autoHideDuration={2500}
                    onRequestClose={() => {this.setState({autoSaveNotify: false});}}
                />
            </div>
        );
    }
}
