// @flow
import * as React from 'react';
import {ipcRenderer} from 'electron';
import TextField from 'material-ui/TextField';
import FloatingActionButton from 'material-ui/FloatingActionButton';
import Snackbar from 'material-ui/Snackbar';
import ContentSave from 'material-ui/svg-icons/content/save';
import ContentAdd from 'material-ui/svg-icons/content/add';
import ActionToday from 'material-ui/svg-icons/action/today';
import Paper from 'material-ui/Paper';
import Divider from 'material-ui/Divider';
import IconMenu from 'material-ui/IconMenu';
import MenuItem from 'material-ui/MenuItem';
import IconButton from 'material-ui/IconButton';
import MoreVertIcon from 'material-ui/svg-icons/navigation/more-vert';
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

    getLineInfo(pos: number, str: string): {
        str: string,
        posBegin: number,
        posEnd: number,
        indent: number,
    } {
        let posBegin: number = pos;
        while (posBegin > 0) {
            if (str.charAt(posBegin - 1) === '\n') break;
            posBegin--;
        }
        let posEnd: number = str.indexOf('\n', pos);
        if (posEnd === -1) {
            posEnd = str.length;
        }
        const line: string = str.slice(posBegin, posEnd);
        let indent: number = 0;
        for (; indent < line.length; indent++) {
            if (line.charAt(indent) !== ' ') break;
        }
        return {
            str: line,  // should not include \n
            posBegin: posBegin,
            posEnd: posEnd,
            indent: indent,
        };
    }

    render() {
        const numOfContentLines: number = (this.state.content.match(/\n/g) || []).length + 1;
        const contentRows: number = Math.max(6, numOfContentLines);
        console.log('contentRows', contentRows);
        return (
            <div style={{ marginLeft: '250px' }}>
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
                            fontFamily: 'Monaco',
                            fontSize: '13px',
                        }}
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
                        // separate as a component class
                        name="contentInput"
                        style={{
                            margin: '8px',
                            fontFamily: 'Monaco',
                            fontSize: '13px',
                            lineHeight: '1.4em',
                        }}
                        ref={input => {this.contentInput = input;}}
                        hintText="Content"
                        underlineShow={false}
                        multiLine={true}
                        rows={contentRows}
                        rowsMax={contentRows}
                        fullWidth={true}
                        value={this.state.content}
                        onChange={(e: Object, newValue: string) => {this.setState({
                            content: newValue,
                            modified: true,
                        });}}
                        onKeyPress={(e: Object) => {
                            console.log('keypress', e.key);
                            if (e.target.selectionStart !== e.target.selectionEnd) return;
                            const pos = e.target.selectionStart;
                            if (e.key === 'Enter') {
                                e.preventDefault();
                                const prevLine = this.getLineInfo(pos - 1, this.state.content);
                                const newContent = this.state.content.substring(0, pos) + '\n' + ' '.repeat(prevLine.indent) + this.state.content.substring(pos);
                                this.setState({content: newContent}, () => {
                                    this.contentInput.input.refs.input.selectionStart = pos + prevLine.indent + 1;
                                    this.contentInput.input.refs.input.selectionEnd = pos + prevLine.indent + 1;
                                });
                            }
                        }}
                        onKeyDown={(e: Object) => {
                            console.log('keydown', e.key);
                            if (e.target.selectionStart !== e.target.selectionEnd) return;
                            if (e.key === 'Tab') {
                                const TAB_SPACES = 2;
                                const pos = e.target.selectionStart;
                                e.preventDefault();
                                const content = this.state.content;
                                const line = this.getLineInfo(pos, content);
                                if (!e.shiftKey) {  // Tab
                                    const numAdd: number = TAB_SPACES - (line.indent % TAB_SPACES);
                                    const newContent = content.substring(0, line.posBegin) + ' '.repeat(numAdd) + content.substring(line.posBegin);
                                    this.setState({content: newContent}, () => {
                                        this.contentInput.input.refs.input.selectionStart = pos + numAdd;
                                        this.contentInput.input.refs.input.selectionEnd = pos + numAdd;
                                    });
                                } else {    // Shift+Tab
                                    if (line.indent > 0) {
                                        const r: number = line.indent % TAB_SPACES;
                                        const numRemove: number = (r === 0) ? TAB_SPACES : r;
                                        const newContent = content.substring(0, line.posBegin) + content.substring(line.posBegin + numRemove);
                                        this.setState({content: newContent}, () => {
                                            this.contentInput.input.refs.input.selectionStart = pos - numRemove;
                                            this.contentInput.input.refs.input.selectionEnd = pos - numRemove;
                                        });

                                    }
                                }
                            }
                        }}
                        onKeyUp={(e: Object) => {
                            //console.log('keyup', e.key);
                            if (e.target.selectionStart !== e.target.selectionEnd) return;
                            //const pos = e.target.selectionStart;
                        }}
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
                            <IconMenu
                                iconButtonElement={<IconButton><MoreVertIcon /></IconButton>}
                                anchorOrigin={{horizontal: 'right', vertical: 'top'}}
                                targetOrigin={{horizontal: 'right', vertical: 'top'}}
                                style={{
                                    marginLeft: 'auto',
                                    marginRight: '8px',
                                    marginTop: '8px',
                                    marginBottom: '8px',
                                }}
                            >
                                <MenuItem
                                    primaryText="Delete"
                                    onTouchTap={this.deleteNote.bind(this)}
                                />
                            </IconMenu>
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
