// @flow
import * as React from 'react';
import {ipcRenderer} from 'electron';
import TextField from 'material-ui/TextField';
import FloatingActionButton from 'material-ui/FloatingActionButton';
import Snackbar from 'material-ui/Snackbar';
import ContentSave from 'material-ui/svg-icons/content/save';
import ContentAdd from 'material-ui/svg-icons/content/add';
import ContentClear from 'material-ui/svg-icons/content/clear';
import ActionToday from 'material-ui/svg-icons/action/today';
import Paper from 'material-ui/Paper';
import Divider from 'material-ui/Divider';
import padStart from 'string.prototype.padstart';

import type {Note, NoteId, SavedNote} from '../types/AppTypes';

padStart.shim();

type State = {
    id: ?number,
    title: string,
    content: string,
    modified: boolean,
    autoSaveNotify: boolean,
};

const initState: State = {
    id: undefined,
    title: '',
    content: '',
    modified: false,
    autoSaveNotify: false,
};

const AUTO_SAVE_INTERVAL_SEC = 5;

export default class NoteEditor extends React.PureComponent {
    state: State;
    autoSaveTimer: number;
    titleInput: TextField;
    contentInput: TextField;

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
        ipcRenderer.on('SAVE_NOTE_REPLY', (event: Object, id: number) => {
            this.setState({
                id: id,
                autoSaveNotify: true,
            });
        });
        this.autoSaveTimer = setInterval(this.save.bind(this), AUTO_SAVE_INTERVAL_SEC * 1000);
        this.newNote();
    }

    componentWillUnmount() {
        clearInterval(this.autoSaveTimer);
    }

    save(): void {
        if (this.canSave()) {
            ipcRenderer.send('SAVE_NOTE', this.noteObject());
            this.setState({modified: false});
        }
    }

    static toDateString(date: Date): string {
        return `${date.getFullYear()}-${(date.getMonth() + 1).toString().padStart(2, '0')}-${date.getDate().toString().padStart(2, '0')}`;
    }

    newNote(): void {
        this.setState(initState);
        this.titleInput.focus();
    }

    newNoteToday(): void {
        this.setState(initState);
        this.setState({title: NoteEditor.toDateString(new Date())});
        this.contentInput.focus();
    }

    open(id: NoteId): void {
        ipcRenderer.once('GET_NOTE_REPLY', (event: Object, note: SavedNote) => {
            if (note.id != id) {
                throw new Error('invalid note id');
            }
            this.setState({
                id: note.id,
                title: note.title,
                content: note.content,
                modified: false,
            });
        });
        ipcRenderer.send('GET_NOTE', id);
    }

    deleteNote(): void {
        if (this.state.id) {
            ipcRenderer.send('DELETE_NOTE', this.state.id);
            this.setState(initState);
            this.titleInput.focus();
        }
    }

    render() {
        return (
            <div>
                <Paper
                    zDepth={1}
                    rounded={false}
                    style={{margin: '8px'}}
                >
                    <TextField
                        name="titleInput"
                        style={{margin: '8px'}}
                        ref={input => {this.titleInput = input;}}
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
                        style={{margin: '8px'}}
                        ref={input => {this.contentInput = input;}}
                        hintText="Content"
                        underlineShow={false}
                        multiLine={true}
                        rows={6}
                        fullWidth={true}
                        value={this.state.content}
                        onChange={(e: Object, newValue: string) => {this.setState({
                            content: newValue,
                            modified: true,
                        });}}
                    />
                    <Divider/>
                    <div style={{width: '100%', display: 'flex'}}>
                        <FloatingActionButton
                            style={{margin: '8px'}}
                            onTouchTap={this.save.bind(this)}
                            disabled={!this.canSave()}
                        >
                            <ContentSave />
                        </FloatingActionButton>
                        <FloatingActionButton
                            style={{margin: '8px'}}
                            onTouchTap={this.newNote.bind(this)}
                            disabled={this.canSave()}
                        >
                            <ContentAdd />
                        </FloatingActionButton>
                        <FloatingActionButton
                            style={{margin: '8px'}}
                            onTouchTap={this.newNoteToday.bind(this)}
                            disabled={this.canSave()}
                        >
                            <ActionToday />
                        </FloatingActionButton>
                        {this.state.id &&
                            <FloatingActionButton
                                style={{
                                    marginLeft: 'auto',
                                    marginRight: '8px',
                                    marginTop: '8px',
                                    marginBottom: '8px',
                                }}
                                secondary={true}
                                onTouchTap={this.deleteNote.bind(this)}
                            >
                                <ContentClear />
                            </FloatingActionButton>
                        }
                    </div>
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
