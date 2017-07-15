// @flow
import * as React from 'react';
import {ipcRenderer} from 'electron';
import MenuItem from 'material-ui/MenuItem';
import Drawer from 'material-ui/Drawer';
import TextField from 'material-ui/TextField';
import * as Immutable from 'immutable';

import type {NoteId, SavedNote} from '../types/AppTypes';

type Props = {
    onSelectNote: (NoteId) => void,
}

type State = {
    notes: Immutable.List<SavedNote>,
    filterInputValue: string,
};

export default class NoteViewer extends React.PureComponent {
    props: Props;
    state: State;

    constructor() {
        super();
        this.state = {
            notes: Immutable.List(),
            filterInputValue: '',
        };

        ipcRenderer.on('REFRESH_NOTES', (event: Object, notes: Array<SavedNote>) => {
            this.setState({notes: Immutable.List(notes)});
        });

        ipcRenderer.send('FETCH_NOTES');
    }

    render() {
        // console.log(this.state.notes);
        const listItems = this.state.notes.sortBy(note => note.dtUpdated).reverse().map(note => {
            if (!note.hasOwnProperty('id')) {
                throw new Error('no id in note');
            }
            return (
                <MenuItem
                    key={note.id}
                    style={{
                        minHeight: '32px',
                        lineHeight: '32px',
                    }}
                    innerDivStyle={{
                        fontFamily: 'Monaco',
                        fontSize: '13px',
                    }}
                    primaryText={`${note.title}`}
                    onTouchTap={this.props.onSelectNote.bind(this, note.id)}
                />
            );
        });

        return (
            <Drawer
                width={250}
                open={true}
                docked={true}
            >
                <TextField
                    name="noteFilterInput"
                    style={{
                        margin: '0 8px',
                        width: 250 - 16,
                        fontFamily: 'Monaco',
                        fontSize: '13px',
                    }}
                    hintText="Filter"
                    value={this.state.filterInputValue}
                    onChange={(e: Object, newValue: string) => {
                        this.setState({
                            filterInputValue: newValue,
                        });
                    }}
                />
                {listItems}
            </Drawer>
        );
    }
}
