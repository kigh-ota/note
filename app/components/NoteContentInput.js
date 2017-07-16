// @flow
import * as React from 'react';
import {AppStyles} from '../constants/AppConstants';
import EditorUtil from '../utils/EditorUtil';
import type {LineInfo} from '../utils/EditorUtil';

type Props = {
    value: string,
    changeContent: (string) => void,
    changeSelection: (number, number) => void,
}

type State = {
}

export default class NoteContentInput extends React.PureComponent {
    props: Props;
    state: State;
    input: HTMLTextAreaElement;

    constructor() {
        super();
        this.state = {};
    }

    setSelection(start: number, end: number): void {
        this.input.selectionStart = start;
        this.input.selectionEnd = end;
    }

    focus(): void {
        this.input.focus();
    }

    decreaseIndent(pos: number): void {
        const ret = EditorUtil.decreaseIndent(this.props.value, pos);
        this.props.changeContent(ret.updated);
        this.props.changeSelection(pos - ret.numRemove, pos - ret.numRemove);
    }

    removeBullet(pos: number, line: LineInfo): void {
        const newContent = this.props.value.substring(0, pos - line.bullet.length) + this.props.value.substring(pos);
        this.props.changeContent(newContent);
        this.props.changeSelection(pos - line.bullet.length, pos - line.bullet.length);
    }

    insert(str: string, pos: number): void {
        const newContent: string = this.props.value.substring(0, pos) + str + this.props.value.substring(pos);
        this.props.changeContent(newContent);
        this.props.changeSelection(pos + str.length, pos + str.length);
    }

    render() {
        const lines: number = (this.props.value.match(/\n/g) || []).length + 1;
        const lineHeightEm: number = 1.4;

        return (
            <textarea
                ref={input => {this.input = input;}}
                style={Object.assign({}, AppStyles.textBase, {
                    margin: '8px',
                    lineHeight: lineHeightEm + 'em',
                    width: '100%',
                    resize: 'none',
                    border: 'none',
                    outline: 'none',
                    height: AppStyles.textBase.fontSize * lineHeightEm * Math.max(6, lines),    // FIXME
                })}
                value={this.props.value}
                onChange={(e: Object) => {
                    const newValue = e.target.value;
                    const newValueRep = newValue.replace('　', '  ');    // replace full-width space with two half-width spaces
                    this.props.changeContent(newValueRep);
                    const diffChar = newValueRep.length - newValue.length;
                    const newSelectionStart = e.target.selectionStart + diffChar;
                    const newSelectionEnd = e.target.selectionEnd + diffChar;
                    this.props.changeSelection(newSelectionStart, newSelectionEnd);
                }}
                onKeyPress={(e: Object) => {
                    console.log('NoteContentInput.keypress', e.key);
                    if (e.target.selectionStart !== e.target.selectionEnd) return;
                    const pos = e.target.selectionStart;
                    if (e.key === 'Enter') {
                        const line = EditorUtil.getLineInfo(pos, this.props.value);
                        if (line.col === line.str.length && line.indent > 0 && line.str.length === line.indent) {
                            // when there's indent only and the cursor is at the end of line
                            e.preventDefault();
                            this.decreaseIndent(pos);
                        } else if (line.bullet && line.str.length === line.indent + line.bullet.length && line.str.length === line.indent) {
                            // when there's indent and bullet only and the cursor is at the end of line
                            e.preventDefault();
                            this.removeBullet(pos, line);
                        } else if (line.col >= line.indent + line.bullet.length) {
                            // when the cursor is after the indent and bullet (if exists)
                            // => continues indent and bullet (if exists)
                            e.preventDefault();
                            const strInsert: string = '\n' + ' '.repeat(line.indent) + line.bullet;
                            this.insert(strInsert, pos);
                        } else if (line.bullet && line.col === line.indent) {
                            // when the cursor is between indent and bullet
                            // => continues only the indent
                            e.preventDefault();
                            const strInsert: string = '\n' + ' '.repeat(line.indent);
                            this.insert(strInsert, pos);
                        }
                    }
                }}
                onKeyDown={(e: Object) => {
                    console.log('NoteContentInput.keydown', e.key);
                    if (e.target.selectionStart !== e.target.selectionEnd) {    // some text selected
                        const posStart = e.target.selectionStart;
                        const posEnd = e.target.selectionEnd;
                        if (e.key === 'Tab') {
                            e.preventDefault();
                            if (!e.shiftKey) {  // Tab
                                const ret = EditorUtil.increaseIndentRange(this.props.value, posStart, posEnd);
                                this.props.changeContent(ret.updated);
                                this.props.changeSelection(posStart + ret.numAddStart, posEnd + ret.numAddEnd);
                            } else {            // Shift+Tab
                                const ret = EditorUtil.decreaseIndentRange(this.props.value, posStart, posEnd);
                                this.props.changeContent(ret.updated);
                                this.props.changeSelection(posStart - ret.numRemoveStart, posEnd - ret.numRemoveEnd);
                            }
                        }
                    } else {    // no text selected
                        const pos: number = e.target.selectionStart;
                        if (e.key === 'Tab') {
                            e.preventDefault();
                            if (!e.shiftKey) {  // Tab
                                const ret = EditorUtil.increaseIndent(this.props.value, pos);
                                this.props.changeContent(ret.updated);
                                this.props.changeSelection(pos + ret.numAdd, pos + ret.numAdd);
                            } else {    // Shift+Tab
                                this.decreaseIndent(pos);
                            }
                        } else if (e.key === 'Backspace') {
                            const line = EditorUtil.getLineInfo(pos, this.props.value);
                            if (line.indent > 0 && 0 < line.col && line.col <= line.indent) {
                                // decrease indent if cursor is before the indented text
                                e.preventDefault();
                                this.decreaseIndent(pos);
                            }
                        }
                    }
                }}
                onKeyUp={(e: Object) => {
                    this.props.changeSelection(e.target.selectionStart, e.target.selectionEnd);
                }}
                onMouseUp={(e: Object) => {
                    this.props.changeSelection(e.target.selectionStart, e.target.selectionEnd);
                }}
            />
        );
    }
}