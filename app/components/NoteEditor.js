// @flow
import * as React from 'react';
import {ipcRenderer} from 'electron';
import padStart from 'string.prototype.padstart';
import {OrderedSet} from 'immutable';
import StringUtil from '../utils/StringUtil';

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
import {grey500} from 'material-ui/styles/colors';

import MoreVertIcon from 'material-ui/svg-icons/navigation/more-vert';
import ContentAdd from 'material-ui/svg-icons/content/add';
import ActionToday from 'material-ui/svg-icons/action/today';

import type {Note, NoteId, SavedNote} from '../types/AppTypes';
import type {Set} from 'immutable';
import type {LineInfo}  from '../utils/StringUtil';

padStart.shim();

type State = {
    id: ?number,
    title: string,
    content: string,
    modified: boolean,
    autoSaveNotify: boolean,
    selectionStart: number,
    selectionEnd: number,
};

const initState: State = {
    id: undefined,
    title: '',
    content: '',
    modified: false,
    autoSaveNotify: false,
    selectionStart: 0,
    selectionEnd: 0,
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
            content: '#' + dateStr + '\n',
        });
        this.contentInput.focus();
    }

    open(id: NoteId): void {
        this.save();
        ipcRenderer.once('GET_NOTE_REPLY', (event: Object, note: SavedNote) => {
            if (note.id !== id) {
                throw new Error('invalid note id');
            }
            this.setState({
                id: note.id,
                title: note.title,
                content: note.content,
                modified: false,
                selectionStart: 0,
                selectionEnd: 0,
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

    setSelectionStates(input: Object): void {
        this.setState({selectionStart: input.selectionStart});
        this.setState({selectionEnd: input.selectionEnd});
    }

    updateContent(content: string, selectionStart: number, selectionEnd?: number): void {
        this.setState({
            content: content,
            selectionStart: selectionStart,
            selectionEnd: (typeof selectionEnd === 'undefined') ? selectionStart : selectionEnd,
        }, this.updateSelection.bind(this, selectionStart, selectionEnd));
    }

    decreaseIndent(pos: number): void {
        const ret = StringUtil.decreaseIndent(this.state.content, pos);
        this.updateContent(ret.updated, pos - ret.numRemove);
    }

    removeBullet(pos: number, line: LineInfo): void {
        const newContent = this.state.content.substring(0, pos - line.bullet.length) + this.state.content.substring(pos);
        this.updateContent(newContent, pos - line.bullet.length);
    }

    insert(str: string, pos: number): void {
        const newContent: string = this.state.content.substring(0, pos) + str + this.state.content.substring(pos);
        this.updateContent(newContent, pos + str.length);
    }

    updateSelection(start: number, end?: number): void {
        this.contentInput.input.refs.input.selectionStart = start;
        if (typeof end !== 'undefined') {
            this.contentInput.input.refs.input.selectionEnd = end;
        } else {
            this.contentInput.input.refs.input.selectionEnd = start;
        }
    }

    render() {
        const numOfContentLines: number = (this.state.content.match(/\n/g) || []).length + 1;
        const contentRows: number = Math.max(6, numOfContentLines);

        const lineStart = StringUtil.getLineInfo(this.state.selectionStart, this.state.content);
        const lineEnd = StringUtil.getLineInfo(this.state.selectionEnd, this.state.content);

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
                    style={{margin: '8px'}}
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
                        {this.state.id && <DeleteMenu onTouchTap={this.deleteNote.bind(this)} />}
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
                            selectionStart: e.target.selectionStart,
                            selectionEnd: e.target.selectionEnd,
                            modified: true,
                        });}}
                        onKeyPress={(e: Object) => {
                            console.log('keypress', e.key);
                            if (e.target.selectionStart !== e.target.selectionEnd) return;
                            const pos = e.target.selectionStart;
                            if (e.key === 'Enter') {
                                e.preventDefault(); // FIXME 現状、改行のundoができない。contentとカーソル位置のスナップショットを取るなど
                                const line = StringUtil.getLineInfo(pos, this.state.content);
                                if (line.indent > 0 && line.col === line.indent) {
                                    // インデントの直後：インデント下げ
                                    this.decreaseIndent(pos);
                                } else if (line.bullet && line.col === line.indent + line.bullet.length) {
                                    // bulletの直後：bullet削除
                                    this.removeBullet(pos, line);
                                } else {
                                    // インデント・bulletがあれば引き継いで改行
                                    const strInsert: string = '\n' + ' '.repeat(line.indent) + line.bullet;
                                    this.insert(strInsert, pos);
                                }
                            }
                        }}
                        onKeyDown={(e: Object) => {
                            console.log('keydown', e.key);
                            if (e.target.selectionStart !== e.target.selectionEnd) {
                                // 範囲選択中
                                const posStart = e.target.selectionStart;
                                const posEnd = e.target.selectionEnd;
                                if (e.key === 'Tab') {
                                    e.preventDefault();
                                    if (!e.shiftKey) {   // Tab
                                        const ret = StringUtil.increaseIndentRange(this.state.content, posStart, posEnd);
                                        this.updateContent(ret.updated, posStart + ret.numAddStart, posEnd + ret.numAddEnd);
                                    } else {   // Shift+Tab
                                        const ret = StringUtil.decreaseIndentRange(this.state.content, posStart, posEnd);
                                        this.updateContent(ret.updated, posStart - ret.numRemoveStart, posEnd - ret.numRemoveStart);
                                    }
                                }
                            } else {
                                // 範囲選択してないとき
                                const pos: number = e.target.selectionStart;
                                if (e.key === 'Tab') {
                                    e.preventDefault();
                                    if (!e.shiftKey) {  // Tab
                                        const ret = StringUtil.increaseIndent(this.state.content, pos);
                                        this.updateContent(ret.updated, pos + ret.numAdd);
                                    } else {    // Shift+Tab
                                        this.decreaseIndent(pos);
                                    }
                                } else if (e.key === 'Backspace') { // BS
                                    const line = StringUtil.getLineInfo(pos, this.state.content);
                                    if (line.indent > 0 && 0 < line.col && line.col <= line.indent) {
                                        // インデントの途中 or 直後：インデント下げ
                                        e.preventDefault();
                                        this.decreaseIndent(pos);
                                    }
                                }
                            }
                        }}
                        onKeyUp={(e: Object) => {
                            this.setSelectionStates(e.target);
                        }}
                        onMouseUp={(e: Object) => {
                            this.setSelectionStates(e.target);
                        }}
                    />
                    <Divider/>
                    <div style={{width: '100%', display: 'flex'}}>
                        <NewNoteButton onTouchTap={this.newNote.bind(this)}/>
                        <NewNoteTodayButton onTouchTap={this.newNoteToday.bind(this)}/>
                    </div>
                </Paper>
                <Snackbar
                    open={this.state.autoSaveNotify}
                    message="Note saved."
                    autoHideDuration={2500}
                    onRequestClose={() => {this.setState({autoSaveNotify: false});}}
                />
                <div style={{
                    width: '100%',
                    height: 20,
                    position: 'fixed',
                    right: 5,
                    bottom: 5,
                    textAlign: 'right',
                    fontFamily: 'Monaco',
                    fontSize: '10px',
                    color: grey500,
                }}>
                    {
                        `[${this.state.selectionStart}:L${lineStart.num}(${lineStart.indent})${lineStart.bullet},`
                        + `${this.state.selectionEnd}:L${lineEnd.num}(${lineEnd.indent})${lineEnd.bullet}]`
                        + `(${numOfContentLines} lines)`
                    }
                </div>
            </div>
        );

        function NewNoteButton(props) {
            return (
                <FloatingActionButton
                    style={{margin: '8px'}}
                    onTouchTap={props.onTouchTap}
                    disabled={false}
                >
                    <ContentAdd />
                </FloatingActionButton>
            );
        }

        function NewNoteTodayButton(props) {
            return (
                <FloatingActionButton
                    style={{margin: '8px'}}
                    onTouchTap={props.onTouchTap}
                    disabled={false}
                >
                    <ActionToday />
                </FloatingActionButton>
            );
        }

        function DeleteMenu(props) {
            return (
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
                        onTouchTap={props.onTouchTap}
                    />
                </IconMenu>
            );
        }
    }
}
