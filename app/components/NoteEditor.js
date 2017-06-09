// @flow
import * as React from 'react';
import {ipcRenderer} from 'electron';

import TextField from 'material-ui/TextField';
import FloatingActionButton from 'material-ui/FloatingActionButton';
import Snackbar from 'material-ui/Snackbar';
// import ContentSave from 'material-ui/svg-icons/content/save';
import Paper from 'material-ui/Paper';
import Divider from 'material-ui/Divider';
import IconMenu from 'material-ui/IconMenu';
import MenuItem from 'material-ui/MenuItem';
import Chip from 'material-ui/Chip';
import IconButton from 'material-ui/IconButton';

import MoreVertIcon from 'material-ui/svg-icons/navigation/more-vert';
import ContentAdd from 'material-ui/svg-icons/content/add';
import ActionToday from 'material-ui/svg-icons/action/today';

import padStart from 'string.prototype.padstart';
import {OrderedSet} from 'immutable';

import type {Note, NoteId, SavedNote} from '../types/AppTypes';
import type {Set} from 'immutable';

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

type Tag = string;

const AUTO_SAVE_INTERVAL_SEC = 15;

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

    shouldSave(): boolean {
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
        if (this.shouldSave()) {   // 保存の必要がなければ保存しない
            ipcRenderer.send('SAVE_NOTE', this.noteObject());
            this.setState({modified: false});
        }
    }

    static toDateString(date: Date): string {
        return `${date.getFullYear()}-${(date.getMonth() + 1).toString().padStart(2, '0')}-${date.getDate().toString().padStart(2, '0')}`;
    }

    newNote(): void {
        this.save();
        this.setState(initState);
        this.titleInput.focus();
    }

    newNoteToday(): void {
        this.setState(initState);
        const dateStr = NoteEditor.toDateString(new Date());
        this.setState({
            title: dateStr,
            content: '#' + dateStr,
        });
        this.contentInput.focus();
    }

    open(id: NoteId): void {
        this.save();
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

    static parseTags(content: string): Set<Tag> {
        return OrderedSet(
            content.split('\n').filter(line => {
                return line.match(/^#\S+$/);
            }).map(line => {
                return line.substring(1);
            }).filter(tag => {
                return !tag.includes('#');
            })
        );
    }

    render() {
        const numOfContentLines: number = (this.state.content.match(/\n/g) || []).length + 1;
        const contentRows: number = Math.max(6, numOfContentLines);
        console.log('contentRows', contentRows);

        const tagChips = NoteEditor.parseTags(this.state.content).map((tag, key) => {
            return (
                <Chip
                    key={key}
                    style={{margin: 4}}
                    labelStyle={{fontFamily: 'Monaco', fontSize: '11px'}}
                >
                    {tag}
                </Chip>
            );
        });

        return (
            <div style={{ marginLeft: '250px' }}>
                <Paper
                    zDepth={1}
                    rounded={false}
                    style={{
                        margin: '8px',
                    }}
                >
                    <div style={{width: '100%', display: 'flex'}}>
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
                    <Divider/>
                    <div style={{
                        display: 'flex',
                        flexWrap: 'wrap',
                        minHeight: 10,
                    }}>
                        {tagChips}
                    </div>
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
                                e.preventDefault(); // FIXME 現状、改行のundoができない。
                                const prevLine = this.getLineInfo(pos, this.state.content);
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
                        {/*
                        <FloatingActionButton
                            style={{margin: '8px'}}
                            onTouchTap={this.save.bind(this)}
                            disabled={!this.canSave()}
                        >
                            <ContentSave />
                        </FloatingActionButton>
                        */}
                        <FloatingActionButton
                            style={{margin: '8px'}}
                            onTouchTap={this.newNote.bind(this)}
                            disabled={false}
                        >
                            <ContentAdd />
                        </FloatingActionButton>
                        <FloatingActionButton
                            style={{margin: '8px'}}
                            onTouchTap={this.newNoteToday.bind(this)}
                            disabled={false}
                        >
                            <ActionToday />
                        </FloatingActionButton>
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
